import http from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app.js';
import config from './config/config.js';

// Chat router factory (nhận io, trả về Router)
import createChatRouter from './routes/admin/chat.routes.js';

const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Simple socket middleware (placeholder)
io.use((socket, next) => {
  // TODO: verify token, gắn user vào socket.data.user
  next();
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (conversationId: string) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined ${conversationId}`);
    }
  });

  socket.on('leave', (conversationId: string) => {
    if (conversationId) {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left ${conversationId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected', socket.id, reason);
  });
});

// Mount chat admin router với io
try {
  const chatRouter = (createChatRouter as any)(io);
  app.use('/api/admin/chat', chatRouter);
  console.log('Mounted chat router on /api/admin/chat');
} catch (err) {
  console.warn('Could not mount chat router (factory missing or error):', err);
  // Nếu file chat.routes.ts export default là Router thường, dùng:
  // app.use('/api/admin/chat', createChatRouter);
}

const port = Number(config.PORT || 4000);
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} (pid ${process.pid})`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
