import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

app.use(cors());


app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^': '/auth',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Gateway]: Redirigiendo ${req.method} ${req.url} -> ${AUTH_SERVICE_URL}`);
    },
    onError: (err, req, res) => {
        console.error('[Gateway] Error:', err);
        res.status(500).json({ message: 'Error en el Gateway al conectar con Auth' });
    }
}));

app.use('/api/admin', createProxyMiddleware({
    target: ADMIN_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/admin': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Gateway] Proxiying ${req.method} request to Admin Service`);
    }
}));

app.get('/', (req, res) => {
    res.json({
        name: 'MKapu Import API Gateway',
        status: 'Online',
        microservices: {
            auth: 'Running on port 3001'
        }
    });
});

app.listen(PORT, () => {
    console.log(`API Gateway listo en http://localhost:${PORT}`);
});