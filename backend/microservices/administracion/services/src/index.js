import express from 'express';
import cors from 'cors';
import usuarioRoutes from './infrastructure/routes/usuarios.routes.js';
import pool from '../../../../database/config/database.js';

const app = express();
const PORT = process.env.ADMIN_PORT || 3002;

app.use(cors());
app.use(express.json());


app.use('/users', usuarioRoutes);

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'OK', service: 'Administration' });
    } catch (error) {
        res.status(500).json({ status: 'Error', db: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`[Admin Service] Ejecutándose en puerto ${PORT}`);
});