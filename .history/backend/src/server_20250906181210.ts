// src/server.ts
import http from 'http';
import util from 'util';
import { Server as IOServer } from 'socket.io';

(async () => {
  // Global handlers
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
    // Dynamic import app và config
    const appModule = await import('./app.js');
    const app = (appModule as any).default ?? appModule;
    const cfgModule = await import('./config/config.js');
    const config: any = (cfgModule as any).default ?? cfgModule;

    const server = http.createServer(app);

    // Initialize Socket.io
    let io: IOServer | undefined;
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
        socket.on('disconnect', (reason) =>
          console.log('Socket disconnected', socket.id, reason)
        );
      });
    } catch (err) {
      console.warn('Socket.io not initialized (optional). Error:', util.inspect(err, { depth: 3 }));
      io = undefined;
    }

    // ----- Mount chat user routes -----
try {
  const userChatMod = await import('./routes/user/chat.routes.js');
  const createUserChatRouter = (userChatMod as any).default;
  if (typeof createUserChatRouter === 'function' && io) {
    const userChatRouter = createUserChatRouter(io);
    (app as any).use('/api/user/chat', userChatRouter);
    console.log('✅ Mounted user chat router at /api/user/chat');
  } else {
    console.warn('⚠️ User chat router is not a function or io not available; skipping.');
  }
} catch (err) {
  console.warn('⚠️ Could not import/mount user chat routes:', util.inspect(err, { depth: 3 }));
}

// ----- Mount chat admin routes -----
try {
  const adminChatMod = await import('./routes/admin/chat.routes.js');
  const createAdminChatRouter = (adminChatMod as any).default;
  if (typeof createAdminChatRouter === 'function' && io) {
    const adminChatRouter = createAdminChatRouter(io);
    (app as any).use('/api/admin/chat', adminChatRouter);
    console.log('✅ Mounted admin chat router at /api/admin/chat');
  } else {
    console.warn('⚠️ Admin chat router is not a function or io not available; skipping.');
  }
} catch (err) {
  console.warn('⚠️ Could not import/mount admin chat routes:', util.inspect(err, { depth: 3 }));
}


    // ---- Port/Host/BACKEND_URL setup ----
    const port = Number(process.env.PORT ?? config.PORT ?? 5000);
    const host = process.env.HOST ?? config.HOST ?? '0.0.0.0';

    server.listen(port, host, () => {
      const isWildcard = host === '0.0.0.0' || host === '::';
      const computedURL = `http://${isWildcard ? 'localhost' : host}:${port}`;
      const backendURL = config.BACKEND_URL ?? process.env.BACKEND_URL ?? computedURL;

      try {
        (app as any).locals.BACKEND_URL = backendURL;
        (app as any).set?.('BACKEND_URL', backendURL);
      } catch {}

      if (!process.env.BACKEND_URL) process.env.BACKEND_URL = backendURL;

      console.log(`🚀 Server running at ${backendURL} (pid ${process.pid})`);
      console.log(`🌐 Allowed CORS origin: ${config.FRONTEND_URL ?? '*'}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('Graceful shutdown initiated');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
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
