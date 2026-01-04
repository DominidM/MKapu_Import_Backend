import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env. DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database:  process.env.DB_NAME || 'mkapu_inventory_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a MySQL exitosa');
    console.log(`Base de datos: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}: ${process.env.DB_PORT}`);
    console.log(`Usuario: ${process. env.DB_USER}`);
    connection.release();
  } catch (error) {
    console.error(' Error conectando a MySQL: ');
    console.error(`   Mensaje: ${error.message}`);
    console.error('');
    console.error('Verifica: ');
    console.error('   1. MySQL está corriendo');
    console.error('   2. Credenciales en .env son correctas');
    console.error('   3. La base de datos existe');
    console.error('   4. El usuario tiene permisos');
  }
};

// Ejecutar test de conexión al iniciar
testConnection();

export default pool;