// src/routes/user/chat.routes.ts
import { Router } from 'express';
import * as ChatCtrl from '../../controllers/user/chat.controller.js';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';

const router = Router();

// Get conversations (pinned admin chats first)
router.get('/', protect, userOnly, ChatCtrl.getConversations);

// Get messages for a conversation (query string)
router.get('/messages', protect, userOnly, ChatCtrl.getMessages);

// Send message (user)
router.post('/send', protect, userOnly, ChatCtrl.sendMessage);

// Mark message read
router.post('/message/:id/read', protect, userOnly, ChatCtrl.markMessageRead);

// Soft-delete message for me
router.delete('/message/:id', protect, userOnly, ChatCtrl.deleteMessageForMe);

export default router;
