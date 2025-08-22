// src/server.ts
/**
 * Robust server bootstrap for ESM + ts-node/esm
 * - dynamic import so we can catch import-time errors clearly
 * - mounts chat router factory (if available) with socket.io
 */

import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

// top-level handlers for debugging
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && (err.stack || err));
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason && (reason.stack || reason));
});

(async () => {
  try {
    console.log('Bootstrapping server... cwd=', process.cwd());

    // dynamic import app & config
    const appMod = await import('./app.js');
    const app = appMod.default || appMod;
    const cfgMod = await import('./config/config.js');
    const config = cfgMod.default || cfgMod;

    // create HTTP server
    const server = http.createServer(app);

    // try to import socket.io and chat router factory
    let io: any = null;
    try {
      const { Server: IOServer } = await import('socket.io');
      io = new IOServer(server, {
        cors: {
          origin: config.FRONTEND_URL || '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });

      // basic logging for socket
      io.on('connection', (socket: any) => {
        console.log('Socket connected:', socket.id);
        socket.on('join', (room: string) => socket.join(room));
        socket.on('leave', (room: string) => socket.leave(room));
        socket.on('disconnect', (reason: any) => console.log('Socket disconnected', socket.id, reason));
      });
    } catch (err) {
      console.warn('socket.io not initialized (optional). Error:', err && (err.stack || err));
    }

    // mount chat admin router factory if available
    try {
      // the chat router file in your repo should export a default factory function
      // that accepts io and returns an express Router.
      const chatMod = await import('./routes/admin/chat.routes.js');
      const chatFactory = chatMod.default || chatMod.createChatRouter || chatMod.createChatController;
      if (chatFactory && typeof chatFactory === 'function') {
        const chatRouter = chatFactory(io);
        if (chatRouter && typeof chatRouter === 'function' && app.use) {
          app.use('/api/admin/chat', chatRouter);
          console.log('Mounted chat router at /api/admin/chat');
        }
      } else {
        console.log('No chat router factory exported; skipping mounting chat admin router.');
      }
    } catch (err) {
      console.warn('Chat routes import failed or not present (optional). Error:', err && (err.stack || err));
    }

    const port = Number(process.env.PORT || config.PORT || 4000);
    server.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port} (pid ${process.pid})`);
    });

    // graceful shutdown
    const graceful = () => {
      console.log('Shutting down HTTP server...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        console.warn('Forcing exit');
        process.exit(1);
      }, 10000).unref();
    };
    process.on('SIGINT', graceful);
    process.on('SIGTERM', graceful);
  } catch (err) {
    console.error('Fatal bootstrap error:', err && (err.stack || err));
    process.exit(1);
  }
})();
