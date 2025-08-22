// src/routes/admin/chat.routes.ts
import { Router } from 'express';
import type { Server as IOServer } from 'socket.io';
import { protect } from '../../middlewares/protect.js';
import { adminOnly } from '../../middlewares/adminOnly.js';

// NOTE: controller factory
import { createChatController } from '../../controllers/admin/chat.controller.js';

/**
 * createChatRouter(io)
 * - Trả về Router đã bind các handlers từ chat.controller.createChatController(io)
 */
export function createChatRouter(io: IOServer) {
  const router = Router();

  // get handlers from factory
  const chat = createChatController(io);

  // middlewares: protected + adminOnly (CSKH)
  router.use(protect);
  router.use(adminOnly);

  // IMPORTANT: chat.createConversation etc are arrays (validation + handler),
  // express typing may complain; cast to any to avoid type error or use spread when using validation chains.
  router.post('/conversations', chat.createConversation as any);
  router.get('/conversations', chat.getConversations as any);
  router.get('/messages', chat.getMessages as any);
  router.post('/send', chat.sendMessage as any);
  router.post('/:id/read', chat.markMessageRead as any);
  router.delete('/:id', chat.deleteMessageForMe as any);

  return router;
}

export default createChatRouter;
