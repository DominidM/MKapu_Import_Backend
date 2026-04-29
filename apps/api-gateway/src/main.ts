import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const httpProxy = require('http-proxy') as typeof import('http-proxy');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: [
      'Content-Type', 'Accept', 'Authorization',
      'x-role', 'x-transfer-mode',
    ],
  });

  const authUrl      = process.env.AUTH_SERVICE_URL      ?? 'http://127.0.0.1:3001';
  const adminUrl     = process.env.ADMIN_SERVICE_URL     ?? 'http://127.0.0.1:3002';
  const salesUrl     = process.env.SALES_SERVICE_URL     ?? 'http://127.0.0.1:3003';
  const logisticsUrl = process.env.LOGISTICS_SERVICE_URL ?? 'http://127.0.0.1:3005';

  const chatUrl = adminUrl;

  // --- HTTP proxy ---
  app.use('/auth',      createProxyMiddleware({ target: authUrl,      changeOrigin: true, pathRewrite: { '^/auth': '' } }));
  app.use('/sales',     createProxyMiddleware({ target: salesUrl,     changeOrigin: true, pathRewrite: { '^/sales': '' } }));
  app.use('/admin',     createProxyMiddleware({ target: adminUrl,     changeOrigin: true, pathRewrite: { '^/admin': '' } }));
  app.use('/logistics', createProxyMiddleware({ target: logisticsUrl, changeOrigin: true, pathRewrite: { '^/logistics': '' } }));

  // --- WebSocket proxy ---
  const wsProxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true });

  wsProxy.on('error', (err: Error, _req: IncomingMessage, res: any) => {
    console.error('[WS Error]', err.message);
    if (res?.destroy) res.destroy();
  });

  interface WsRoute {
    prefix: string;
    target: string;
    strip: boolean;
  }

  const wsRoutes: WsRoute[] = [
    { prefix: '/chat/socket.io', target: chatUrl,      strip: true  },
    { prefix: '/sales',          target: salesUrl,      strip: true  },
    { prefix: '/admin',          target: adminUrl,      strip: true  },
    { prefix: '/logistics',      target: logisticsUrl,  strip: true  },
  ];

  app.getHttpServer().on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = String(req.url ?? '');

    const route = wsRoutes.find(r => url.startsWith(r.prefix));

    if (!route) {
      console.warn('[WS] Sin ruta para:', url);
      socket.destroy();
      return;
    }

    if (route.strip) {
      const socketIoIdx = route.prefix.indexOf('/socket.io');
      const stripped = socketIoIdx !== -1
        ? url.slice(socketIoIdx)
        : url.slice(route.prefix.length) || '/';
      req.url = stripped;
    }

    console.log(`[WS] ${url} → ${route.target}${req.url}`);

    
    const tryProxy = (attempt: number) => {
      
    wsProxy.ws(req, socket, head, { target: route.target }, (err) => {
      if (err) {
        const isRefused = (err as any).code === 'ECONNREFUSED';
        if (isRefused && attempt < 10) {                          
          console.warn(`[WS] ${route.target} no disponible, reintento ${attempt + 1}/10...`);
          setTimeout(() => {
            if (!socket.destroyed) tryProxy(attempt + 1);       
          }, 3000);
        } else {
          if (!isRefused) {
            console.error(`[WS Proxy Error] ${(err as Error).message}`);
          }
          if (!isRefused && !socket.destroyed) socket.destroy();
        }
      }
    });
  };

    tryProxy(1);
  });

  await app.listen(3000);
  console.log('API Gateway corriendo en http://localhost:3000');
}

void bootstrap();