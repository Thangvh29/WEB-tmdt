// src/server.ts
import http from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app.js';
import config from './config/config.js';

// Chat router factory (expects io) — this file should export default factory createChatRouter
import createChatRouter from './routes/admin/chat.routes.js';

// Create HTTP server from Express app
const server = http.createServer(app);

// Create Socket.IO server attached to HTTP server
const io = new IOServer(server, {
  cors: {
    origin: config.CLIENT_URL || '',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // pingTimeout / pingInterval / transports can be configured here
});

// Simple socket auth / handlers (you should implement real auth/token checks)
io.use((socket, next) => {
  // if you send auth token on connection, verify here
  // const token = socket.handshake.auth?.token;
  // verify token and attach user info to socket.data.user
  return next();
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Example join room event: client should emit { conversationId }
  socket.on('join', (conversationId: string) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room ${conversationId}`);
    }
  });

  // Example leave
  socket.on('leave', (conversationId: string) => {
    if (conversationId) {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left room ${conversationId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected', socket.id, reason);
  });
});

// Mount chat admin router with io
try {
  const chatRouter = (createChatRouter as any)(io); // createChatRouter should be a factory that returns Router
  app.use('/api/admin/chat', chatRouter);
  console.log('Mounted chat router on /api/admin/chat');
} catch (err) {
  console.warn('Could not mount chat router (factory missing or error):', err);
  // If createChatRouter is not a factory but a plain Router, you can instead:
  // app.use('/api/admin/chat', createChatRouter);
}

// Start server
const port = Number(config.PORT || 4000);
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port} (pid ${process.pid})`);
});

// Optional graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('HTTP server closed');
    // close DB if desired
    process.exit(0);
  });
});
