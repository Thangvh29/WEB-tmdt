import { Router } from 'express';
import { createUserChatController } from '../../controllers/user/chat.controller.js';
import { protect } from '../../middlewares/protect.js';
import { userOnly } from '../../middlewares/userOnly.js';
import type { Server as IOServer } from 'socket.io';

// Hàm khởi tạo router với dependency io
export function createChatRouter(io: IOServer) {
  const router = Router();
  
  // Khởi tạo controller với io
  const chatCtrl = createUserChatController(io);

  // Get conversations (pinned admin chats first)
  router.get('/', protect, userOnly, chatCtrl.getConversations);

  // Get messages for a conversation (query string)
  router.get('/messages', protect, userOnly, chatCtrl.getMessages);

  // Send message (user)
  router.post('/send', protect, userOnly, chatCtrl.sendMessage);

  // Mark message read
  router.post('/message/:id/read', protect, userOnly, chatCtrl.markMessageRead);

  // Soft-delete message for me
  router.delete('/message/:id', protect, userOnly, chatCtrl.deleteMessageForMe);

  // Create or open conversation
  router.post('/open', protect, userOnly, chatCtrl.openConversation);

  return router;
}