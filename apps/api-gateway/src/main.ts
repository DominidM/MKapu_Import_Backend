import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as httpProxy from 'http-proxy';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-role',
      'x-transfer-mode',
    ],
  });

  const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const adminUrl = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3002';
  const salesUrl = process.env.SALES_SERVICE_URL ?? 'http://localhost:3003';
  const logisticsUrl =
    process.env.LOGISTICS_SERVICE_URL ?? 'http://localhost:3005';

  // HTTP proxies. El trafico WebSocket se resuelve solo en el handler upgrade.
  app.use(
    '/auth',
    createProxyMiddleware({
      target: authUrl,
      changeOrigin: true,
      pathRewrite: { '^/auth': '' },
    }),
  );
  app.use(
    '/sales',
    createProxyMiddleware({
      target: salesUrl,
      changeOrigin: true,
      pathRewrite: { '^/sales': '' },
    }),
  );
  app.use(
    '/admin',
    createProxyMiddleware({
      target: adminUrl,
      changeOrigin: true,
      pathRewrite: { '^/admin': '' },
    }),
  );
  app.use(
    '/logistics',
    createProxyMiddleware({
      target: logisticsUrl,
      changeOrigin: true,
      pathRewrite: { '^/logistics': '' },
    }),
  );

  const wsProxy = httpProxy.createProxyServer({ changeOrigin: true });

  wsProxy.on('error', (err, _req, socket) => {
    console.error('[WS Error]', err.message);
    (socket as { destroy?: () => void }).destroy?.();
  });

  const wsRoutes: Array<{ prefix: string; target: string }> = [
    { prefix: '/sales', target: salesUrl },
    { prefix: '/admin', target: adminUrl },
    { prefix: '/logistics', target: logisticsUrl },
  ];

  app.getHttpServer().on('upgrade', (req: any, socket: any, head: any) => {
    const url = String(req.url ?? '');
    console.log(`[WS Upgrade] ${url}`);

    const route = wsRoutes.find(({ prefix }) => url.startsWith(prefix));
    if (!route) {
      socket.destroy();
      return;
    }

    req.url = url.replace(new RegExp(`^${route.prefix}`), '') || '/';

    wsProxy.ws(req, socket, head, { target: route.target }, (err) => {
      console.error('[WS Proxy Error]', err);
      socket.destroy();
    });
  });

  await app.listen(3000);
  console.log('API Gateway corriendo en http://localhost:3000');
}

void bootstrap();
