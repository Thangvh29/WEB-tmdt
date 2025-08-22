// controllers/chat.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import type { Server as IOServer } from 'socket.io';
import { Conversation } from '../../models/conversation.model.js';
import { Message } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../types.js';

/**
 * createChatController(io)
 * - Trả về object chứa các handlers để mount routes.
 * - Sử dụng socket.io instance để emit sự kiện realtime.
 *
 * Events emitted:
 * - 'conversation:updated' -> payload: { conversationId, lastMessage, updatedAt }
 * - 'message:new' -> payload: message object
 * - 'message:read' -> payload: { conversationId, messageId, readerId }
 *
 * NOTE:
 * - Giả định bạn subscribe clients vào phòng theo conversationId: `socket.join(conversationId)`
 * - Bạn cần bind socket logic (join/leave) trong layer socket server.
 */

export function createChatController(io: IOServer) {
  // Helper: validation error
  const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

  // Helper: emit conversation update to participants (uses rooms by conversationId)
  function emitConversationUpdated(convId: string, payload: any) {
    try {
      io.to(convId).emit('conversation:updated', payload);
      // optionally emit a global event for admin dashboards
      io.to('admins').emit('conversation:updated', { conversationId: convId, ...payload });
    } catch (err) {
      // don't crash if emit fails
      console.error('emitConversationUpdated error', err);
    }
  }

  // Helper: emit message new
  function emitMessageNew(convId: string, message: any) {
    try {
      io.to(convId).emit('message:new', message);
      // admin channel as fallback
      io.to('admins').emit('message:new', { conversationId: convId, message });
    } catch (err) {
      console.error('emitMessageNew error', err);
    }
  }

  // Helper: emit message read
  function emitMessageRead(convId: string, payload: { messageId: string; readerId: string }) {
    try {
      io.to(convId).emit('message:read', payload);
      io.to('admins').emit('message:read', { conversationId: convId, ...payload });
    } catch (err) {
      console.error('emitMessageRead error', err);
    }
  }

  // Validation sets

  const sendMessageValidation = [
    body('conversationId').isMongoId().withMessage('conversationId phải là ObjectId'),
    body('type').optional().isIn(['text', 'image', 'file', 'product', 'order', 'system']).withMessage('type không hợp lệ'),
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

  // Create or open 1:1 / group conversation
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

        // include current user
        const participantsSet = new Set(participantIds.map(s => s.toString()));
        participantsSet.add(String(user._id));
        const participants = Array.from(participantsSet).map(s => new Types.ObjectId(s));

        // For 1:1 (isGroup=false and participants.length===2) try to reuse existing conversation by participantsKey
        if (!isGroup && participants.length === 2) {
          const sorted = participants.map(p => p.toString()).sort();
          const participantsKey = sorted.join('_');
          let conv = await Conversation.findOne({ participantsKey, isGroup: false });
          if (!conv) {
            conv = new Conversation({ participants, isGroup: false, participantsKey, title: null, avatar: null });
            await conv.save();
          }
          return res.status(201).json({ conversation: conv });
        }

        // else create group conversation
        const conv = new Conversation({ participants, isGroup: !!isGroup, title, avatar });
        await conv.save();
        return res.status(201).json({ conversation: conv });
      } catch (err) {
        console.error('createConversation error', err);
        next(err);
      }
    },
  ];

  // Get conversations list for current user (paged)
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
        const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === true;

        const filter: any = { participants: { $in: [new Types.ObjectId(user._id)] } };
        // Optionally filter to only conversations where there are unread messages
        if (unreadOnly) {
          // conversations with at least one message not read by this user
          const convIdsWithUnread = await Message.distinct('conversation', {
            readBy: { $ne: new Types.ObjectId(user._id) },
            deletedFor: { $ne: new Types.ObjectId(user._id) },
          });
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
          .lean();

        const total = await Conversation.countDocuments(filter);

        const mapped = convs.map(conv => {
          const lastMessage = conv.lastMessage
            ? {
                _id: conv.lastMessage._id,
                content: conv.lastMessage.content,
                type: conv.lastMessage.type,
                preview: conv.lastMessage.preview,
                sender: conv.lastMessage.sender,
                createdAt: conv.lastMessage.createdAt,
                isRead: Array.isArray(conv.lastMessage.readBy) ? conv.lastMessage.readBy.some((id: any) => String(id) === String(user._id)) : false,
              }
            : null;
          return {
            _id: conv._id,
            participants: conv.participants.map((p: any) => ({ _id: p._id, name: p.name, avatar: p.avatar, role: p.role, email: p.email })),
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

  // Get messages for a conversation with cursor (beforeId) pagination
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

        const conv = await Conversation.findById(conversationId);
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        if (!conv.participants.some((p: any) => String(p) === String(user._id))) {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập hội thoại này' });
        }

        // build query: only messages not deletedFor this user
        const q: any = { conversation: conv._id, deletedFor: { $ne: new Types.ObjectId(user._id) } };
        if (beforeId) q._id = { $lt: new Types.ObjectId(beforeId) };

        // fetch messages newest first
        const msgs = await Message.find(q)
          .populate('sender', 'name avatar role')
          .sort({ _id: -1 })
          .limit(limit)
          .lean();

        // total count of visible messages (optional; can be heavy)
        const total = await Message.countDocuments({ conversation: conv._id, deletedFor: { $ne: new Types.ObjectId(user._id) } });

        // map to client shape and return in chronological order (oldest first)
        const ordered = msgs.reverse().map((m: any) => ({
          _id: m._id,
          conversation: m.conversation,
          content: m.content,
          type: m.type,
          attachments: m.attachments,
          meta: m.meta,
          sender: m.sender,
          isRead: Array.isArray(m.readBy) ? m.readBy.some((id: any) => String(id) === String(user._id)) : false,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }));

        return res.json({ messages: ordered, total, limit, beforeId: beforeId || null });
      } catch (err) {
        console.error('getMessages error', err);
        next(err);
      }
    },
  ];

  // Send message (and emit via socket)
  const sendMessage = [
    ...sendMessageValidation,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);
      try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { conversationId, content, type = 'text', attachments = [], meta = {} } = req.body as any;

        const conv = await Conversation.findById(conversationId);
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        if (!conv.participants.some((p: any) => String(p) === String(user._id))) {
          return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong hội thoại này' });
        }

        // Create message
        const msg = new Message({
          conversation: conv._id,
          sender: user._id,
          type,
          content: type === 'text' ? content : undefined,
          attachments: Array.isArray(attachments) ? attachments : [],
          meta,
          readBy: [user._id], // sender has read it
        });

        await msg.save();

        // update conversation.lastMessage + updatedAt
        conv.lastMessage = msg._id;
        conv.updatedAt = new Date();
        await conv.save();

        // populate sender for payload
        const populated = await msg.populate('sender', 'name avatar role').execPopulate();

        const payload = {
          _id: populated._id,
          conversation: populated.conversation,
          content: populated.content,
          type: populated.type,
          attachments: populated.attachments,
          meta: populated.meta,
          sender: populated.sender,
          isRead: true,
          createdAt: populated.createdAt,
        };

        // Emit to room (conversationId)
        emitMessageNew(String(conv._id), payload);

        // Also emit conversation update (for lists)
        emitConversationUpdated(String(conv._id), {
          lastMessage: { _id: payload._id, preview: populated.preview, type: payload.type, createdAt: payload.createdAt, sender: payload.sender },
          updatedAt: conv.updatedAt,
        });

        return res.status(201).json({ message: 'Gửi tin nhắn thành công', data: payload });
      } catch (err) {
        console.error('sendMessage error', err);
        next(err);
      }
    },
  ];

  // Mark message read (adds user to readBy)
  const markMessageRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const messageId = req.params.id;
      if (!messageId || !Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: 'messageId không hợp lệ' });

      const msg = await Message.findById(messageId);
      if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

      const conv = await Conversation.findById(msg.conversation);
      if (!conv || !conv.participants.some((p: any) => String(p) === String(user._id))) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập tin nhắn này' });
      }

      // mark read if not present
      const already = Array.isArray(msg.readBy) && msg.readBy.some((id: any) => String(id) === String(user._id));
      if (!already) {
        msg.readBy = msg.readBy || [];
        msg.readBy.push(user._id);
        await msg.save();
        // emit read event
        emitMessageRead(String(conv._id), { messageId: msg._id, readerId: user._id });
      }

      return res.json({ message: 'Đã đánh dấu đã đọc', messageId: msg._id });
    } catch (err) {
      console.error('markMessageRead error', err);
      next(err);
    }
  };

  // Soft-delete message for self (deletedFor push). Admin could delete for all by removing document or setting flag.
  const deleteMessageForMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const messageId = req.params.id;
      if (!messageId || !Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: 'messageId không hợp lệ' });

      const msg = await Message.findById(messageId);
      if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

      // mark deletedFor for this user
      msg.deletedFor = msg.deletedFor || [];
      if (!msg.deletedFor.some((id: any) => String(id) === String(user._id))) {
        msg.deletedFor.push(user._id);
        await msg.save();
      }
      return res.json({ message: 'Đã xóa tin nhắn cho bạn', messageId: msg._id });
    } catch (err) {
      console.error('deleteMessageForMe error', err);
      next(err);
    }
  };

  // Export handlers
  return {
    createConversation,
    getConversations,
    getMessages,
    sendMessage,
    markMessageRead,
    deleteMessageForMe,
  };
}
