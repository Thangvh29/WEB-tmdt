// src/server.ts
import http from 'http';
import util from 'util';
import { Server as IOServer } from 'socket.io';

(async () => {
  // global handlers so unhandled things are visible in console
  process.on('uncaughtException', (err) => {
    // print full object safely
    console.error('UNCAUGHT EXCEPTION:', util.inspect(err, { depth: 5, colors: true }));
    // if it's an Error with stack, print it too
    if (err && typeof err === 'object' && 'stack' in err) {
      // @ts-ignore
      console.error('stack:', (err as any).stack);
    }
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', util.inspect(reason, { depth: 5, colors: true }));
    if (reason && typeof reason === 'object' && 'stack' in (reason as any)) {
      // @ts-ignore
      console.error('stack:', (reason as any).stack);
    }
  });

  try {
    // dynamic import app + config so we can catch import errors
    const appModule = await import('./app.js');
    const app = appModule.default ?? appModule;
    const cfgModule = await import('./config/config.js');
    const config = cfgModule.default ?? cfgModule;

    const server = http.createServer(app);

    // init socket.io (optional)
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

    // Try to mount chat admin router factory if present
    try {
      const chatMod = await import('./routes/admin/chat.routes.js');
      // possible exported names
      const candidates = [
        chatMod.default,
        chatMod.createChatRouter,
        chatMod.createChatController,
        chatMod.createChatFactory,
      ];
      const factory = candidates.find((c) => typeof c === 'function') as ((ioArg: any) => any) | undefined;

      if (factory) {
        const chatRouter = factory(io);
        if (chatRouter && typeof chatRouter === 'function') {
          app.use('/api/admin/chat', chatRouter);
          console.log('Mounted chat router at /api/admin/chat');
        } else {
          console.warn('Chat factory returned non-router value; skipping mounting.');
        }
      } else {
        console.log('No chat router factory function exported from ./routes/admin/chat.routes.js; skipping.');
      }
    } catch (err) {
      console.warn('Could not import/mount chat routes (optional). Error:', util.inspect(err, { depth: 3 }));
    }

    const port = Number(process.env.PORT ?? config.PORT ?? 4000);
    server.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port} (pid ${process.pid})`);
    });

    // graceful shutdown
    const shutdown = () => {
      console.log('Graceful shutdown initiated');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
      // force after 10s
      setTimeout(() => {
        console.warn('Forcing exit');
        process.exit(1);
      }, 10_000).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    // catch bootstrap error and print safely
    console.error('Fatal bootstrap error:', util.inspect(err, { depth: 5, colors: true }));
    if (err && typeof err === 'object' && 'stack' in err) {
      // @ts-ignore
      console.error('stack:', (err as any).stack);
    }
    process.exit(1);
  }
})();
