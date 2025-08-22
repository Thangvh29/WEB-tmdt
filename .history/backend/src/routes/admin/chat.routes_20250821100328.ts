// src/routes/admin/chat.routes.ts
import { Router } from 'express';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';

import {
  getConversations,
  getMessages,
  sendMessage,
  markMessageRead,
} from '../../controllers/admin/chat.controller.js'; // chỉnh path nếu cần

const router = Router();

// Chỉ dành cho staff/admin (CSKH)
router.use(protect);
router.use(adminOnly);

/**
 * GET /api/admin/chat/conversations?page=&limit=
 * Liệt kê hội thoại 1:1 có admin tham gia
 */
router.get('/conversations', getConversations as unknown as any);

/**
 * GET /api/admin/chat/messages?conversationId=&page=&limit=
 * Lấy tin nhắn trong 1 hội thoại (pagination)
 */
router.get('/messages', getMessages as unknown as any);

/**
 * POST /api/admin/chat/send
 * Body: { conversationId, content, type, attachments }
 */
router.post('/send', sendMessage as unknown as any);

/**
 * POST /api/admin/chat/:id/read
 * Đánh dấu tin nhắn (message id) là đã đọc
 */
router.post('/:id/read', markMessageRead as unknown as any);

export default router;
