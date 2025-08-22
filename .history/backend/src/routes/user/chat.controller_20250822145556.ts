// src/controllers/user/chat.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Conversation } from '../../models/conversation.model.js';
import { Message } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

/**
 * User chat controller
 * - getConversations: list conversations for current user, with admin conversations pinned first
 * - getMessages: fetch messages for a conversation (cursor pagination)
 * - sendMessage: send message in a conversation (user only)
 * - markMessageRead: mark message read
 * - deleteMessageForMe: soft-delete for current user
 *
 * Note: This controller does not use socket.io directly. If you want realtime,
 * inject io and emit events similarly to admin controller.
 */

const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

/** Validation sets */
const getConversationsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
];

const getMessagesValidation = [
  query('conversationId').isMongoId().withMessage('conversationId phải là ObjectId'),
  query('beforeId').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const sendMessageValidation = [
  body('conversationId').isMongoId().withMessage('conversationId phải là ObjectId'),
  body('content').optional().isString().isLength({ max: 2000 }),
  body('type').optional().isIn(['text', 'image', 'file', 'product', 'order', 'system']),
  body('attachments').optional().isArray(),
];

/** GET /api/user/chats
 *  Return user's conversations. Conversations that include an admin participant are pinned to top.
 */
export const getConversations = [
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

      // find conversations where current user is a participant
      const convs = await Conversation.find({ participants: { $in: [new Types.ObjectId((user as any)._id ?? (user as any).id ?? user._id)] } })
        .populate('participants', 'name avatar role')
        .populate({
          path: 'lastMessage',
          select: 'content type preview createdAt readBy sender',
          populate: { path: 'sender', select: 'name avatar role' },
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await Conversation.countDocuments({ participants: { $in: [new Types.ObjectId((user as any)._id ?? (user as any).id ?? user._id)] } }).exec();

      // separate pinned (has admin participant) vs others
      const pinned: any[] = [];
      const others: any[] = [];

      for (const c of convs) {
        const participants = (c.participants || []) as any[];
        const hasAdmin = participants.some(p => p && p.role === 'admin');
        const lastMessage = c.lastMessage
          ? {
              _id: (c.lastMessage as any)._id,
              content: (c.lastMessage as any).content,
              type: (c.lastMessage as any).type,
              preview: (c.lastMessage as any).preview,
              sender: (c.lastMessage as any).sender,
              createdAt: (c.lastMessage as any).createdAt,
              isRead: Array.isArray((c.lastMessage as any).readBy)
                ? (c.lastMessage as any).readBy.some((id: any) => String(id) === String((user as any)._id ?? user._id))
                : false,
            }
          : null;

        const mapped = {
          _id: c._id,
          participants: participants.map(p => ({ _id: p._id, name: p.name, avatar: p.avatar, role: p.role })),
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

      // pinned first (keep each list sorted by updatedAt desc because we already sorted)
      const combined = [...pinned, ...others];

      return res.json({ conversations: combined, total, page, limit });
    } catch (err) {
      console.error('user.getConversations error:', err);
      next(err);
    }
  },
];

/** GET /api/user/chats/messages?conversationId=...&beforeId=...&limit=...
 *  Return messages for conversation. Exclude messages deletedFor the current user.
 */
export const getMessages = [
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

      // check participant
      const userIdStr = String((user as any)._id ?? user._id);
      if (!conv.participants.some((p: any) => String(p) === userIdStr)) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập hội thoại này' });
      }

      const q: any = { conversation: conv._id, deletedFor: { $ne: new Types.ObjectId((user as any)._id ?? user._id) } };
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

      const total = await Message.countDocuments({ conversation: conv._id, deletedFor: { $ne: new Types.ObjectId((user as any)._id ?? user._id) } }).exec();

      const ordered = msgs.reverse().map((m: any) => ({
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

/** POST /api/user/chats/send
 *  body: { conversationId, content, type?, attachments? }
 *  Only users can call (use userOnly in route)
 */
export const sendMessage = [
  ...sendMessageValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const { conversationId, content = '', type = 'text', attachments = [], meta = {} } = req.body as any;

      if (!Types.ObjectId.isValid(conversationId)) return res.status(400).json({ message: 'conversationId không hợp lệ' });

      const conv = await Conversation.findById(conversationId).exec();
      if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

      // ensure user is participant
      const userId = (user as any)._id ?? user._id;
      if (!conv.participants.some((p: any) => String(p) === String(userId))) {
        return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong hội thoại này' });
      }

      const msg = await Message.create({
        conversation: conv._id,
        sender: userId,
        type,
        content: type === 'text' ? content : undefined,
        attachments: Array.isArray(attachments) ? attachments : [],
        meta,
        readBy: [userId],
      });

      // update conversation lastMessage & updatedAt
      conv.lastMessage = (msg as any)._id;
      conv.updatedAt = new Date();
      await conv.save();

      // populate sender for response
      const populated = await Message.findById((msg as any)._id).populate('sender', 'name avatar role').lean().exec();

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

      // Note: If you want realtime, emit here using socket.io instance (not included)

      return res.status(201).json({ message: 'Gửi tin nhắn thành công', data: payload });
    } catch (err) {
      console.error('user.sendMessage error:', err);
      next(err);
    }
  },
];

/** POST /api/user/chats/message/:id/read
 *  mark a message as read (adds user to readBy)
 */
export const markMessageRead = [
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
        // optionally emit event to room via socket.io
      }

      return res.json({ message: 'Đã đánh dấu đã đọc', messageId: msg._id });
    } catch (err) {
      console.error('user.markMessageRead error:', err);
      next(err);
    }
  },
];

/** DELETE /api/user/chats/message/:id
 *  Soft-delete message for current user (add to deletedFor)
 */
export const deleteMessageForMe = [
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

      return res.json({ message: 'Đã xóa tin nhắn cho bạn', messageId: msg._id });
    } catch (err) {
      console.error('user.deleteMessageForMe error:', err);
      next(err);
    }
  },
];
