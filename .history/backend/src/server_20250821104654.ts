import http from 'http';
import util from 'util';
import { Server as IOServer } from 'socket.io';

(async () => {
  // Global handlers for uncaught exceptions and rejections
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', util.inspect(err, { depth: 5, colors: true }));
    if (err && typeof err === 'object' && 'stack' in err) {
      console.error('stack:', (err as any).stack);
    }
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', util.inspect(reason, { depth: 5, colors: true }));
    if (reason && typeof reason === 'object' && 'stack' in (reason as any)) {
      console.error('stack:', (reason as any).stack);
    }
  });

  try {
    // Dynamic import app and config
    const appModule = await import('./app.js');
    const app = appModule.default ?? appModule;
    const cfgModule = await import('./config/config.js');
    const config = cfgModule.default ?? cfgModule;

    const server = http.createServer(app);

    // Initialize Socket.io (optional)
    let io: IOServer | null = null;
    try {
      const { Server } = await import('socket.io');
      io = new Server(server, {
        cors: {
          origin: config.FRONTEND_URL ?? '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });

      io.on('connection', (socket) => {
        console.log('Socket connected', socket.id);
        socket.on('join', (room: string) => {
          if (room) socket.join(room);
        });
        socket.on('leave', (room: string) => {
          if (room) socket.leave(room);
        });
        socket.on('disconnect', (reason) => console.log('Socket disconnected', socket.id, reason));
      });
    } catch (err) {
      console.warn('Socket.io not initialized (optional). Error:', util.inspect(err, { depth: 3 }));
      io = null;
    }

    // Mount chat admin routes
    try {
      const chatMod = await import('./routes/admin/chat.routes.js');
      const chatRouter = chatMod.default; // Directly use the exported router
      if (chatRouter && typeof chatRouter === 'object' && 'use' in chatRouter) {
        app.use('/api/admin/chat', chatRouter);
        console.log('Mounted chat router at /api/admin/chat');
      } else {
        console.warn('Chat routes is not a valid Express router; skipping mounting.');
      }
    } catch (err) {
      console.warn('Could not import/mount chat routes (optional). Error:', util.inspect(err, { depth: 3 }));
    }

    const port = Number(process.env.PORT ?? config.PORT ?? 4000);
    server.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port} (pid ${process.pid})`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('Graceful shutdown initiated');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => {
        console.warn('Forcing exit');
        process.exit(1);
      }, 10_000).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Fatal bootstrap error:', util.inspect(err, { depth: 5, colors: true }));
    if (err && typeof err === 'object' && 'stack' in err) {
      console.error('stack:', (err as any).stack);
    }
    process.exit(1);
  }
})();