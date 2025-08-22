// src/server.ts
/**
 * Robust server bootstrap for ts-node/ESM environment.
 * Use dynamic import so we can catch import-time errors and show full stack.
 */
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

// top-level error handlers (very helpful)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION - exiting process');
  console.error(err && (err.stack || err));
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION - maybe promise was rejected and not handled:');
  console.error(reason && (reason.stack || reason));
});

(async () => {
  try {
    console.log('Bootstrap server - entry (cwd):', process.cwd());

    // Dynamic imports so we can catch and log errors during module resolution
    const { default: app } = await import('./app.js'); // app.ts transpiles -> runtime .js (ts-node/esm supports)
    const configMod = await import('./config/config.js');
    const config = configMod.default || configMod;

    // socket/chat router factory (optional)
    let chatRouterFactory;
    try {
      const mod = await import('./routes/admin/chat.routes.js');
      chatRouterFactory = mod.default || mod.createChatRouter || mod.createChatController || mod.createChatController?.default || mod;
    } catch (err) {
      // not fatal; we'll log and continue (chat might be optional)
      console.warn('Chat router module not found or failed to import (will continue without):', err && (err.stack || err));
      chatRouterFactory = null;
    }

    // create HTTP server (for socket.io)
    const server = http.createServer(app);

    // initialize socket.io only if you want real-time chat
    let io: any = null;
    if (chatRouterFactory) {
      // create io lazily to avoid importing socket.io at top if not needed
      try {
        const { Server: IOServer } = await import('socket.io');
        io = new IOServer(server, {
          cors: {
            origin: config.FRONTEND_URL || config.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
          },
        });

        io.use((socket: any, next: any) => {
          // TODO: implement real socket auth if you pass tokens from client
          return next();
        });

        io.on('connection', (socket: any) => {
          console.log('Socket connected', socket.id);
          socket.on('join', (room: string) => {
            try {
              socket.join(room);
            } catch (e) { /* ignore */ }
          });
        });

        // mount chat router if it's a factory that returns an express Router
        try {
          const chatRouter = typeof chatRouterFactory === 'function' ? chatRouterFactory(io) : chatRouterFactory;
          if (chatRouter && typeof app.use === 'function') {
            app.use('/api/admin/chat', chatRouter);
            console.log('Chat router mounted at /api/admin/chat');
          }
        } catch (err) {
          console.warn('Failed to mount chat router:', err && (err.stack || err));
        }
      } catch (err) {
        console.warn('socket.io dynamic import failed (skipping realtime):', err && (err.stack || err));
      }
    }

    const port = Number(process.env.PORT || config.PORT || 4000);
    server.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port} (pid ${process.pid})`);
    });

    // graceful shutdown
    const shutdown = async () => {
      console.log('Graceful shutdown initiated');
      server.close(() => {
        console.log('HTTP server closed');
        // optionally close DB connections here
        process.exit(0);
      });
      // force exit after timeout
      setTimeout(() => {
        console.warn('Forcing shutdown');
        process.exit(1);
      }, 10000).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    // If import fails, show detailed info
    console.error('Fatal error during server bootstrap:');
    console.error(err && (err.stack || err));
    process.exit(1);
  }
})();
