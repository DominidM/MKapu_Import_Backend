import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-role'],
  });

  const authUrl      = process.env.AUTH_SERVICE_URL      ?? 'http://localhost:3001';
  const adminUrl     = process.env.ADMIN_SERVICE_URL     ?? 'http://localhost:3002';
  const salesUrl     = process.env.SALES_SERVICE_URL     ?? 'http://localhost:3003';
  const logisticsUrl = process.env.LOGISTICS_SERVICE_URL ?? 'http://localhost:3005';

  const authProxy = createProxyMiddleware({
    target: authUrl,
    changeOrigin: true,
    pathRewrite: { '^/auth': '' },
  });

  const adminProxy = createProxyMiddleware({
    target: adminUrl,
    changeOrigin: true,
    pathRewrite: { '^/admin': '' },
    ws: true,
    logger: console,
  });

  const salesProxy = createProxyMiddleware({
    target: salesUrl,
    changeOrigin: true,
    pathRewrite: { '^/sales': '' },
    ws: true,
    logger: console,
  });

  const logisticsProxy = createProxyMiddleware({
    target: logisticsUrl,
    changeOrigin: true,
    pathRewrite: { '^/logistics': '' },
    ws: true,
    logger: console,
  });

  app.use('/auth',      authProxy);
  app.use('/admin',     adminProxy);
  app.use('/sales',     salesProxy);
  app.use('/logistics', logisticsProxy);

  const httpServer = app.getHttpServer();

  httpServer.on('upgrade', (req: any, socket: any, head: any) => {
    const url: string = req.url ?? '';
    console.log(`[WS Upgrade] ${url}`);

    if (url.startsWith('/sales')) {
      (salesProxy as any).upgrade(req, socket, head);
    } else if (url.startsWith('/admin')) {
      (adminProxy as any).upgrade(req, socket, head);
    } else if (url.startsWith('/logistics')) {
      (logisticsProxy as any).upgrade(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  await app.listen(3000);
  console.log('🌍 API Gateway corriendo en http://localhost:3000');
}
bootstrap();