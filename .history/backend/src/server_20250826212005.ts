// frontend/src/server.ts
import http from 'http';
import util from 'util';

(async () => {
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
    const appModule = await import('./app.js');
    const app = (appModule as any).default ?? appModule;
    const cfgModule = await import('./config/config.js');
    const config: any = (cfgModule as any).default ?? cfgModule;

    const server = http.createServer(app);

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