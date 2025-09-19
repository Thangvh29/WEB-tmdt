import http from 'http';
import util from 'util';
import { Server as IOServer } from 'socket.io';

(async () => {
  // Global handlers for uncaught exceptions and rejections
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', util.inspect(err, { depth: 5, colors: true }));
    if (err && typeof err === 'object' && 'stack' in err) {
      console.error('stack:', (err).stack);
    }
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', util.inspect(reason, { depth: 5, colors: true }));
    if (reason && typeof reason === 'object' && 'stack' in reason) {
      console.error('stack:', (reason).stack);
    }
  });

  try {
    // Dynamic import app and config
    const appModule = await import('./app.js');
    const app = appModule.default ?? appModule;
    const cfgModule = await import('./config/config.js');
    const config = cfgModule.default ?? cfgModule;

    const server = http.createServer(app);

    // determine port (default 5000)
    const port = Number(process.env.PORT ?? config.PORT ?? 5000);

    // If BACKEND_URL not provided in config/env, set a sensible default now
    // so controllers that rely on it can use it.
    // We don't mutate the imported config object (keep it immutable), but we set the env var.
    if (!process.env.BACKEND_URL && !(config && config.BACKEND_URL)) {
      process.env.BACKEND_URL = `http://localhost:${port}`;
      console.log('NOTICE: process.env.BACKEND_URL not set — using', process.env.BACKEND_URL);
    } else {
      // prefer config.BACKEND_URL if present, otherwise process.env
      const effectiveBackend = (config && config.BACKEND_URL) || process.env.BACKEND_URL;
      process.env.BACKEND_URL = effectiveBackend;
      console.log('Using BACKEND_URL =', process.env.BACKEND_URL);
    }

    // Helpful debug info for startup
    console.log('Boot config summary:');
    console.log('  NODE_ENV =', process.env.NODE_ENV || 'development');
    console.log('  PORT =', port);
    console.log('  BACKEND_URL =', process.env.BACKEND_URL);
    console.log('  FRONTEND_URL =', (config && config.FRONTEND_URL) || process.env.FRONTEND_URL);

    // Initialize Socket.io (optional)
    let io;
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
        socket.on('join', (room) => {
          if (room) socket.join(room);
        });
        socket.on('leave', (room) => {
          if (room) socket.leave(room);
        });
        socket.on('disconnect', (reason) =>
          console.log('Socket disconnected', socket.id, reason)
        );
      });
    } catch (err) {
      console.warn('Socket.io not initialized (optional). Error:', util.inspect(err, { depth: 3 }));
      io = undefined;
    }

    // Mount chat user routes (optional)
    try {
      const chatMod = await import('./routes/user/chat.routes.js');
      const createChatRouter = chatMod.createChatRouter;
      if (typeof createChatRouter === 'function' && io) {
        const chatRouter = createChatRouter(io);
        if (chatRouter && typeof chatRouter === 'object' && 'use' in chatRouter) {
          app.use('/api/user/chat', chatRouter);
          console.log('Mounted user chat router at /api/user/chat');
        } else {
          console.warn('User chat routes is not a valid Express router; skipping mounting.');
        }
      } else {
        console.warn('createChatRouter is not a function or io not available; skipping mounting.');
      }
    } catch (err) {
      console.warn('Could not import/mount user chat routes (optional). Error:', util.inspect(err, { depth: 3 }));
    }

    // Mount chat admin routes (optional)
    try {
      const chatMod = await import('./routes/admin/chat.routes.js');
      const chatRouter = chatMod.default;
      if (chatRouter && typeof chatRouter === 'object' && 'use' in chatRouter) {
        app.use('/api/admin/chat', chatRouter);
        console.log('Mounted admin chat router at /api/admin/chat');
      } else {
        console.warn('Admin chat routes is not a valid Express router; skipping mounting.');
      }
    } catch (err) {
      console.warn('Could not import/mount admin chat routes (optional). Error:', util.inspect(err, { depth: 3 }));
    }

    // Start server
    server.listen(port, () => {
      console.log(`🚀 Server running at ${process.env.BACKEND_URL} (pid ${process.pid})`);
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
      console.error('stack:', (err).stack);
    }
    process.exit(1);
  }
})();
