// src/controllers/user/chat.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import type { Server as IOServer } from 'socket.io';
import { Conversation } from '../../models/conversation.model.js';
import { Message } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

/**
 * createUserChatController(io)
 * - giống admin controller nhưng dành cho user endpoints
 * - emit các sự kiện realtime qua socket.io:
 *    'conversation:updated' -> { conversationId, lastMessage, updatedAt }
 *    'message:new' -> message object
 *    'message:read' -> { conversationId, messageId, readerId }
 *
 * NOTE:
 * - giả định client join room theo conversationId (socket.join(conversationId))
 * - admin sockets đang join room 'admins' (admin channel)
 */

export function createUserChatController(io: IOServer) {
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

  /* validations */
  const getConversationsValidation = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),
  ];

  const getMessagesValidation = [
    query('conversationId').isMongoId().withMessage('conversationId phải là ObjectId'),
    query('beforeId').optional().isMongoId().withMessage('beforeId phải là ObjectId'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ];

  const sendMessageValidation = [
    body('conversationId').isMongoId().withMessage('conversationId phải là ObjectId'),
    body('content').optional().isString().isLength({ max: 2000 }),
    body('type').optional().isIn(['text', 'image', 'file', 'product', 'order', 'system']),
    body('attachments').optional().isArray(),
  ];

  const createOrOpenConversationValidation = [
    body('participantIds').optional().isArray({ min: 1 }),
    body('participantIds.*').optional().isMongoId(),
    body('isGroup').optional().isBoolean(),
    body('title').optional().isString().isLength({ max: 200 }),
  ];

  // -----------------------
  // Handlers
  // -----------------------

  /**
   * GET conversations for user
   * pinned: conversations that include any admin participant appear first
   */
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
        const skip = (page - 1) * limit;

        const userId = String((user as any)._id ?? (user as any).id ?? user._id);

        const convs = await Conversation.find({ participants: { $in: [new Types.ObjectId(userId)] } })
          .populate('participants', 'name avatar role')
          .populate({
            path: 'lastMessage',
            select: 'content type preview createdAt readBy sender',
            populate: { path: 'sender', select: 'name avatar' },
          })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec();

        const total = await Conversation.countDocuments({ participants: { $in: [new Types.ObjectId(userId)] } }).exec();

        const pinned: any[] = [];
        const others: any[] = [];

        for (const c of convs || []) {
          const participants = (c.participants || []) as any[];
          const hasAdmin = participants.some((p) => p && p.role === 'admin');

          const lm: any = c.lastMessage;
          const lastMessage =
            lm && typeof lm === 'object'
              ? {
                  _id: lm._id,
                  content: lm.content,
                  type: lm.type,
                  preview: lm.preview,
                  sender: lm.sender,
                  createdAt: lm.createdAt,
                  isRead: Array.isArray(lm.readBy) ? lm.readBy.some((id: any) => String(id) === userId) : false,
                }
              : null;

          const mapped = {
            _id: c._id,
            participants: participants.map((p) => ({ _id: p._id, name: p.name, avatar: p.avatar, role: p.role })),
            isGroup: c.isGroup,
            title: c.title,
            avatar: c.avatar,
            lastMessage,
            memberCount: (c.participants || []).length,
            updatedAt: c.updatedAt,
          };

          if (hasAdmin) pinned.push(mapped);
          else others.push(mapped);
        }

        const combined = [...pinned, ...others];
        return res.json({ conversations: combined, total, page, limit });
      } catch (err) {
        console.error('user.getConversations error:', err);
        next(err);
      }
    },
  ];

  /**
   * GET /messages?conversationId=..&beforeId=..&limit=..
   * Return messages for conversation (exclude those deletedFor user)
   */
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

        if (!Types.ObjectId.isValid(conversationId)) return res.status(400).json({ message: 'conversationId không hợp lệ' });

        const conv = await Conversation.findById(conversationId).exec();
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        const userIdStr = String((user as any)._id ?? user._id);
        if (!conv.participants.some((p: any) => String(p) === userIdStr)) {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập hội thoại này' });
        }

        const q: any = { conversation: conv._id, deletedFor: { $ne: new Types.ObjectId(userIdStr) } };
        if (beforeId) {
          if (!Types.ObjectId.isValid(beforeId)) return res.status(400).json({ message: 'beforeId không hợp lệ' });
          q._id = { $lt: new Types.ObjectId(beforeId) };
        }

        const msgs = await Message.find(q)
          .populate('sender', 'name avatar role')
          .sort({ _id: -1 })
          .limit(limit)
          .lean()
          .exec();

        const total = await Message.countDocuments({ conversation: conv._id, deletedFor: { $ne: new Types.ObjectId(userIdStr) } }).exec();

        const ordered = (msgs || []).reverse().map((m: any) => ({
          _id: m._id,
          conversation: m.conversation,
          content: m.content,
          type: m.type,
          attachments: m.attachments,
          meta: m.meta,
          sender: m.sender,
          isRead: Array.isArray(m.readBy) ? m.readBy.some((id: any) => String(id) === userIdStr) : false,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }));

        return res.json({ messages: ordered, total, limit, beforeId: beforeId || null });
      } catch (err) {
        console.error('user.getMessages error:', err);
        next(err);
      }
    },
  ];

  /**
   * POST /send
   * body: { conversationId, content, type?, attachments?, meta? }
   * - create message doc
   * - update conversation.lastMessage, updatedAt
   * - emit message:new and conversation:updated to room conversationId and admin channel
   */
  const sendMessage = [
    ...sendMessageValidation,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);
      try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { conversationId, content = '', type = 'text', attachments = [], meta = {} } = req.body as any;
        if (!Types.ObjectId.isValid(String(conversationId))) return res.status(400).json({ message: 'conversationId không hợp lệ' });

        const conv = await Conversation.findById(conversationId).exec();
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        const userId = (user as any)._id ?? user._id;
        if (!conv.participants.some((p: any) => String(p) === String(userId))) {
          return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong hội thoại này' });
        }

        const msg = new Message({
          conversation: conv._id,
          sender: userId,
          type,
          content: type === 'text' ? content : undefined,
          attachments: Array.isArray(attachments) ? attachments : [],
          meta,
          readBy: [userId],
        });

        await msg.save();

        // update conv
        conv.lastMessage = msg._id as Types.ObjectId;
        conv.updatedAt = new Date();
        await conv.save();

        // populate sender
        await msg.populate('sender', 'name avatar role');

        const populated: any = msg;

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
        console.error('user.sendMessage error:', err);
        next(err);
      }
    },
  ];

  /**
   * POST /message/:id/read
   * mark message read by current user and emit message:read
   */
  const markMessageRead = [
    param('id').isMongoId(),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);
      try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const messageId = req.params.id;
        if (!Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: 'messageId không hợp lệ' });

        const msg = await Message.findById(messageId).exec();
        if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

        const convId = String((msg as any).conversation);
        if (!convId || !Types.ObjectId.isValid(convId)) return res.status(404).json({ message: 'Không tìm thấy hội thoại của tin nhắn' });

        const conv = await Conversation.findById(convId).exec();
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        const userIdStr = String((user as any)._id ?? user._id);
        if (!conv.participants.some((p: any) => String(p) === userIdStr)) {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập tin nhắn này' });
        }

        if (!Array.isArray(msg.readBy)) msg.readBy = [];
        const already = msg.readBy.some((id: any) => String(id) === userIdStr);
        if (!already) {
          msg.readBy.push((user as any)._id ?? user._id);
          await msg.save();
          emitMessageRead(convId, { messageId: String(msg._id), readerId: userIdStr });
        }

        return res.json({ message: 'Đã đánh dấu đã đọc', messageId: String(msg._id) });
      } catch (err) {
        console.error('user.markMessageRead error:', err);
        next(err);
      }
    },
  ];

  /**
   * DELETE /message/:id
   * soft-delete message for current user (deletedFor push)
   */
  const deleteMessageForMe = [
    param('id').isMongoId(),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);
      try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const messageId = req.params.id;
        if (!Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: 'messageId không hợp lệ' });

        const msg = await Message.findById(messageId).exec();
        if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

        const convId = String((msg as any).conversation);
        if (!convId || !Types.ObjectId.isValid(convId)) return res.status(404).json({ message: 'Không tìm thấy hội thoại của tin nhắn' });

        const conv = await Conversation.findById(convId).exec();
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        const userIdStr = String((user as any)._id ?? user._id);
        if (!conv.participants.some((p: any) => String(p) === userIdStr)) {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập tin nhắn này' });
        }

        msg.deletedFor = msg.deletedFor || [];
        if (!msg.deletedFor.some((id: any) => String(id) === userIdStr)) {
          msg.deletedFor.push((user as any)._id ?? user._id);
          await msg.save();
        }

        return res.json({ message: 'Đã xóa tin nhắn cho bạn', messageId: String(msg._id) });
      } catch (err) {
        console.error('user.deleteMessageForMe error:', err);
        next(err);
      }
    },
  ];

  /**
   * POST /open
   * Create or open a conversation.
   * Body: { participantIds?: string[], isGroup?: boolean, title?: string, avatar?: string }
   * If participantIds omitted or empty, you can use this to open default admin support conversation by passing adminId in participantIds or server deciding which admin to add.
   */
  const openConversation = [
    ...createOrOpenConversationValidation,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);
      try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const body = req.body as any;
        const participantIds: string[] = Array.isArray(body.participantIds) ? body.participantIds : [];
        const isGroup = !!body.isGroup;
        const title = body.title ?? null;
        const avatar = body.avatar ?? null;

        // Always include current user
        const set = new Set(participantIds.map((s) => String(s)));
        set.add(String((user as any)._id ?? user._id));
        const participants = Array.from(set)
  .filter((s): s is string => !!s) // lọc undefined/null
  .map((s) => new Types.ObjectId(s));


        // For 1:1 conversations reuse existing
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

        // create group
        const conv = new Conversation({ participants, isGroup: !!isGroup, title, avatar });
        await conv.save();
        return res.status(201).json({ conversation: conv });
      } catch (err) {
        console.error('user.openConversation error:', err);
        next(err);
      }
    },
  ];

  return {
    getConversations,
    getMessages,
    sendMessage,
    markMessageRead,
    deleteMessageForMe,
    openConversation,
  };
}
