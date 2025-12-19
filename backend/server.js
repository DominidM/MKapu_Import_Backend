import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ IMPORTANTE: Estos middlewares DEBEN estar ANTES de las rutas
app. use(cors());
app.use(express.json());  // ← Esta línea es CRÍTICA
app.use(express. urlencoded({ extended: true }));

// Rutas (DESPUÉS de los middlewares)
app.use('/api/auth', authRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API MKapu Import',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/profile',
      changePassword: 'POST /api/auth/change-password'
    }
  });
});

// Ruta para probar conexión a MySQL
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    res.json({ 
      success: true,
      message: '✅ Conexión a MySQL exitosa',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: '❌ Error conectando a MySQL',
      error:  error.message 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Iniciado:  ${new Date().toLocaleString()}`);
});