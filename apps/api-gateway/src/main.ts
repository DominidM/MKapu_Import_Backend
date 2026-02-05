/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // --- DEFINICIÓN DE PUERTOS (CORREGIDO) ---
  const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const adminUrl = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3002';

  // Ventas ahora está en el 3003 (Antes 3004)
  const salesUrl = process.env.SALES_SERVICE_URL ?? 'http://localhost:3003';

  // Logística ahora está en el 3005 (Antes 3003 o 3004)
  const logisticsUrl =
    process.env.LOGISTICS_SERVICE_URL ?? 'http://localhost:3005';

  // --- 1. PROXIES CON WEBSOCKETS ---
  const adminProxy = createProxyMiddleware({
    target: adminUrl,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/admin': '' },
    logger: console,
    on: {
      proxyReqWs: (proxyReq, req, socket) => {
        socket.on('error', (err) =>
          console.error('WS Proxy Error (Admin):', err),
        );
        socket.setKeepAlive(true, 1000);
      },
    },
  });

  const logisticsProxy = createProxyMiddleware({
    target: logisticsUrl,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/logistics': '' },
    logger: console,
    on: {
      proxyReqWs: (proxyReq, req, socket) => {
        socket.on('error', (err) =>
          console.error('WS Proxy Error (Logistics):', err),
        );
        socket.setKeepAlive(true, 1000);
      },
    },
  });

  // --- 2. REGISTRO DE RUTAS HTTP ---
  app.use(
    '/auth',
    createProxyMiddleware({
      target: authUrl,
      changeOrigin: true,
      pathRewrite: { '^/auth': '' },
    }),
  );

  app.use('/admin', adminProxy);
  app.use('/logistics', logisticsProxy);

  app.use(
    '/sales',
    createProxyMiddleware({
      target: salesUrl,
      changeOrigin: true,
      pathRewrite: { '^/sales': '' },
      // Manejo de body para evitar problemas de "hanging" en POST requests
      on: {
        proxyReq: (proxyReq, req: any) => {
          if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        },
      },
      logger: console,
    }),
  );

  // --- 3. INICIO DEL SERVIDOR ---
  const server = await app.listen(3000);

  // --- 4. MANEJO MANUAL DE HANDSHAKES (WEBSOCKETS) ---
  server.on('upgrade', (req, socket, head) => {
    const url = req.url || '';

    // Admin Sockets
    const isAdminSocket =
      url.startsWith('/admin') ||
      url.startsWith('/users') ||
      url.startsWith('/roles') ||
      url.startsWith('/permissions') ||
      url.startsWith('/headquarters');

    // Logistics Sockets
    const isLogisticsSocket =
      url.startsWith('/logistics') || url.startsWith('/products');

    if (isAdminSocket) {
      console.log(`⚡ Handshake detectado para ADMINISTRATIONN (Namespace: ${url})`);
      // console.log(`⚡ Handshake detectado para ADMINISTRATION`);
      adminProxy.upgrade(req, socket, head);
    } else if (isLogisticsSocket) {
      // console.log(`⚡ Handshake detectado para LOGISTICS`);
      logisticsProxy.upgrade(req, socket, head);
    }
  });

  console.log(
    `🌍 API Gateway MKapu Import corriendo en: http://localhost:3000`,
  );
  console.log(`   👉 Sales -> ${salesUrl}`);
  console.log(`   👉 Logistics -> ${logisticsUrl}`);
}
bootstrap();
