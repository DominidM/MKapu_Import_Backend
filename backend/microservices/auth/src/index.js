import express from 'express';
import authRoutes from './infrastructure/routes/auth.routes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);

const PORT = process.env.AUTH_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔐 Microservicio de Auth corriendo en puerto ${PORT}`);
});