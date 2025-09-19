// src/controllers/admin/chat.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import type { Server as IOServer } from 'socket.io';
import { Conversation } from '../../models/conversation.model.js';
import { Message } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

function buildAvatarURL(req: Request, avatar?: string | null) {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads/')) {
    // DB đã lưu sẵn path tương đối
    return `${req.protocol}://${req.get('host')}${avatar}`;
  }
  // Trường hợp chỉ lưu filename
  return `${req.protocol}://${req.get('host')}/uploads/avatars/${avatar}`;
}


export function createChatController(io: IOServer) {
  const badReq = (res: Response, errors: any) =>
    res.status(400).json({ errors: errors.array ? errors.array() : errors });

  function emitConversationUpdated(convId: string, payload: any) {
    try {
      io.to(convId).emit('conversation:updated', payload);
      io.to('admins').emit('conversation:updated', { conversationId: convId, ...payload });
    } catch (err) {
      console.error('emitConversationUpdated error', err);
    }
  }

  function emitMessageNew(convId: string, message: any) {
    try {
      io.to(convId).emit('message:new', message);
      io.to('admins').emit('message:new', { conversationId: convId, message });
    } catch (err) {
      console.error('emitMessageNew error', err);
    }
  }

  function emitMessageRead(convId: string, payload: { messageId: string; readerId: string }) {
    try {
      io.to(convId).emit('message:read', payload);
      io.to('admins').emit('message:read', { conversationId: convId, ...payload });
    } catch (err) {
      console.error('emitMessageRead error', err);
    }
  }

  const sendMessageValidation = [
    body('conversationId').isMongoId().withMessage('conversationId phải là ObjectId'),
    body('type')
      .optional()
      .isIn(['text', 'image', 'file', 'product', 'order', 'system'])
      .withMessage('type không hợp lệ'),
    body('content').optional().isString().isLength({ max: 2000 }).withMessage('Nội dung tối đa 2000 ký tự'),
    body('attachments').optional().isArray(),
  ];

  const createConversationValidation = [
    body('participantIds').isArray({ min: 1 }).withMessage('participantIds phải là mảng ít nhất 1 người (ngoài admin)'),
    body('participantIds.*').isMongoId().withMessage('participantIds phải chứa ObjectId'),
    body('isGroup').optional().isBoolean(),
    body('title').optional().isString().isLength({ max: 200 }),
  ];

  const getConversationsValidation = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),
    query('unreadOnly').optional().isBoolean().toBoolean(),
  ];

  const getMessagesValidation = [
    query('conversationId').isMongoId().withMessage('conversationId phải là ObjectId'),
    query('beforeId').optional().isMongoId().withMessage('beforeId phải là ObjectId'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ];

  // ----------------------
  // Handlers
  // ----------------------

  const createConversation = [
    ...createConversationValidation,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);
      try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { participantIds, isGroup = false, title = null, avatar = null } = req.body as {
          participantIds: string[];
          isGroup?: boolean;
          title?: string | null;
          avatar?: string | null;
        };

        const participantsSet = new Set(participantIds.map((s) => s.toString()));
        participantsSet.add(String((user as any)._id ?? user._id));
        const participants = Array.from(participantsSet).map((s) => new Types.ObjectId(s));

        if (!isGroup && participants.length === 2) {
          const sorted = participants.map((p) => p.toString()).sort();
          const participantsKey = sorted.join('_');
          let conv = await Conversation.findOne({ participantsKey, isGroup: false }).exec();
          if (!conv) {
            conv = new Conversation({ participants, isGroup: false, participantsKey, title: null, avatar: null });
            await conv.save();
          }
          return res.status(201).json({ conversation: conv });
        }

        const conv = new Conversation({ participants, isGroup: !!isGroup, title, avatar });
        await conv.save();
        return res.status(201).json({ conversation: conv });
      } catch (err) {
        console.error('createConversation error', err);
        next(err);
      }
    },
  ];

const getConversations = [
  ...getConversationsValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 20));
      const unreadOnly = String(req.query.unreadOnly) === 'true';

      const filter: any = {
        participants: {
          $in: [new Types.ObjectId(String((user as any)._id ?? user._id))],
        },
      };

      if (unreadOnly) {
        const convIdsWithUnread = await Message.distinct('conversation', {
          readBy: {
            $ne: new Types.ObjectId(String((user as any)._id ?? user._id)),
          },
          deletedFor: {
            $ne: new Types.ObjectId(String((user as any)._id ?? user._id)),
          },
        }).exec();
        filter._id = { $in: convIdsWithUnread };
      }

      const convs = await Conversation.find(filter)
        .populate('participants', 'name avatar email role')
        .populate({
          path: 'lastMessage',
          select: 'content type preview createdAt readBy sender',
          populate: { path: 'sender', select: 'name avatar' },
        })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      const total = await Conversation.countDocuments(filter).exec();

      const mapped = (convs || []).map((conv: any) => {
        const lm: any = conv.lastMessage;
        const lastMessage =
          lm && typeof lm === 'object'
            ? {
                _id: lm._id,
                content: lm.content,
                type: lm.type,
                preview: lm.preview,
                sender: lm.sender
                  ? {
                      _id: lm.sender._id,
                      name: lm.sender.name,
                      avatar: buildAvatarURL(req, lm.sender.avatar),
                    }
                  : null,
                createdAt: lm.createdAt,
                isRead: Array.isArray(lm.readBy)
                  ? lm.readBy.some(
                      (id: any) =>
                        String(id) === String((user as any)._id ?? user._id)
                    )
                  : false,
              }
            : null;

        return {
          _id: conv._id,
          participants: (conv.participants || []).map((p: any) => ({
            _id: p._id,
            name: p.name,
            avatar: buildAvatarURL(req, p.avatar),
            role: p.role,
            email: p.email,
          })),
          isGroup: conv.isGroup,
          title: conv.title,
          avatar: conv.avatar,
          lastMessage,
          memberCount: conv.participants?.length || 0,
          updatedAt: conv.updatedAt,
        };
      });

      return res.json({ conversations: mapped, total, page, limit });
    } catch (err) {
      console.error('getConversations error', err);
      next(err);
    }
  },
];

const getMessages = [
  ...getMessagesValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const conversationId = String(req.query.conversationId);
      const beforeId = req.query.beforeId ? String(req.query.beforeId) : undefined;
      const limit = Math.min(100, Number(req.query.limit || 50));

      if (!Types.ObjectId.isValid(conversationId))
        return res.status(400).json({ message: 'conversationId không hợp lệ' });

      const conv = await Conversation.findById(conversationId).exec();
      if (!conv)
        return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

      if (
        !conv.participants.some(
          (p: any) => String(p) === String((user as any)._id ?? user._id)
        )
      ) {
        return res
          .status(403)
          .json({ message: 'Bạn không có quyền truy cập hội thoại này' });
      }

      const q: any = {
        conversation: conv._id,
        deletedFor: {
          $ne: new Types.ObjectId(String((user as any)._id ?? user._id)),
        },
      };
      if (beforeId) {
        if (!Types.ObjectId.isValid(beforeId))
          return res.status(400).json({ message: 'beforeId không hợp lệ' });
        q._id = { $lt: new Types.ObjectId(beforeId) };
      }

      const msgs = await Message.find(q)
        .populate('sender', 'name avatar role')
        .sort({ _id: -1 })
        .limit(limit)
        .lean()
        .exec();

      const total = await Message.countDocuments({
        conversation: conv._id,
        deletedFor: {
          $ne: new Types.ObjectId(String((user as any)._id ?? user._id)),
        },
      }).exec();

      const ordered = (msgs || [])
        .reverse()
        .map((m: any) => ({
          _id: m._id,
          conversation: m.conversation,
          content: m.content,
          type: m.type,
          attachments: m.attachments,
          meta: m.meta,
          sender: m.sender
            ? {
                _id: m.sender._id,
                name: m.sender.name,
                role: m.sender.role,
                avatar: buildAvatarURL(req, m.sender.avatar),
              }
            : null,
          isRead: Array.isArray(m.readBy)
            ? m.readBy.some(
                (id: any) =>
                  String(id) === String((user as any)._id ?? user._id)
              )
            : false,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }));

      return res.json({
        messages: ordered,
        total,
        limit,
        beforeId: beforeId || null,
      });
    } catch (err) {
      console.error('getMessages error', err);
      next(err);
    }
  },
];


  const sendMessage = [
    ...sendMessageValidation,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);
      try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { conversationId, content, type = 'text', attachments = [], meta = {} } = req.body as any;

        if (!Types.ObjectId.isValid(String(conversationId))) return res.status(400).json({ message: 'conversationId không hợp lệ' });

        const conv = await Conversation.findById(conversationId).exec();
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        if (!conv.participants.some((p: any) => String(p) === String((user as any)._id ?? user._id))) {
          return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong hội thoại này' });
        }

        const msg = new Message({
          conversation: conv._id,
          sender: (user as any)._id ?? user._id,
          type,
          content: type === 'text' ? content : undefined,
          attachments: Array.isArray(attachments) ? attachments : [],
          meta,
          readBy: [(user as any)._id ?? user._id],
        });

        await msg.save();

        conv.lastMessage = msg._id as Types.ObjectId;
        conv.updatedAt = new Date();
        await conv.save();

        // populate sender on the saved message (modern mongoose: populate returns a promise)
        await msg.populate('sender', 'name avatar role');

        const populated: any = msg; // as any to avoid str  ict typing problems

        const payload = {
          _id: String(populated._id),
          conversation: populated.conversation,
          content: populated.content,
          type: populated.type,
          attachments: populated.attachments,
          meta: populated.meta,
          sender: populated.sender,
          isRead: true,
          createdAt: populated.createdAt,
        };

        emitMessageNew(String(conv._id), payload);

        emitConversationUpdated(String(conv._id), {
          lastMessage: {
            _id: payload._id,
            preview: (populated as any).preview || (payload.content ? String(payload.content).slice(0, 200) : ''),
            type: payload.type,
            createdAt: payload.createdAt,
            sender: payload.sender,
          },
          updatedAt: conv.updatedAt,
        });

        return res.status(201).json({ message: 'Gửi tin nhắn thành công', data: payload });
      } catch (err) {
        console.error('sendMessage error', err);
        next(err);
      }
    },
  ];

  const markMessageRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const messageId = req.params.id;
      if (!messageId || !Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: 'messageId không hợp lệ' });

      const msg = await Message.findById(messageId).exec();
      if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

      // đảm bảo lấy conversationId dưới dạng string (msg.conversation có thể là ObjectId hoặc populated doc)
      const convId = String((msg as any).conversation);
      if (!convId || !Types.ObjectId.isValid(convId)) {
        return res.status(404).json({ message: 'Không tìm thấy hội thoại của tin nhắn' });
      }

      const conv = await Conversation.findById(convId).exec();
      if (!conv || !conv.participants.some((p: any) => String(p) === String((user as any)._id ?? user._id))) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập tin nhắn này' });
      }

      const already = Array.isArray(msg.readBy) && msg.readBy.some((id: any) => String(id) === String((user as any)._id ?? user._id));
      if (!already) {
        msg.readBy = msg.readBy || [];
        msg.readBy.push((user as any)._id ?? user._id);
        await msg.save();
        emitMessageRead(String(conv._id), { messageId: String(msg._id), readerId: String((user as any)._id ?? user._id) });
      }

      return res.json({ message: 'Đã đánh dấu đã đọc', messageId: String(msg._id) });
    } catch (err) {
      console.error('markMessageRead error', err);
      next(err);
    }
  };

  const deleteMessageForMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const messageId = req.params.id;
      if (!messageId || !Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: 'messageId không hợp lệ' });

      const msg = await Message.findById(messageId).exec();
      if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

      msg.deletedFor = msg.deletedFor || [];
      if (!msg.deletedFor.some((id: any) => String(id) === String((user as any)._id ?? user._id))) {
        msg.deletedFor.push((user as any)._id ?? user._id);
        await msg.save();
      }
      return res.json({ message: 'Đã xóa tin nhắn cho bạn', messageId: String(msg._id) });
    } catch (err) {
      console.error('deleteMessageForMe error', err);
      next(err);
    }
  };

  return {
    createConversation,
    getConversations,
    getMessages,
    sendMessage,
    markMessageRead,
    deleteMessageForMe,
  };
}
