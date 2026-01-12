import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const testConnection = async () => {
  let connection;
  
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}${colors.cyan}🔍 PRUEBA DE CONEXIÓN A LA BASE DE DATOS${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mydb',
      port: process.env.DB_PORT || 3306
    });

    console.log(`${colors.green}${colors.bold}✓ Conexión exitosa a MySQL${colors.reset}\n`);

    // Información de conexión
    console.log(`${colors.bold}📋 Información de conexión:${colors.reset}`);
    console.log(`   ${colors.cyan}Host:${colors.reset}     ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    console.log(`   ${colors.cyan}Usuario:${colors.reset}  ${process.env.DB_USER || 'root'}`);
    console.log(`   ${colors.cyan}Base de datos:${colors.reset} ${process.env.DB_NAME || 'mydb'}`);
    console.log();

    // Obtener versión de MySQL
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    console.log(`${colors.bold}🗄️  Versión de MySQL:${colors.reset}`);
    console.log(`   ${versionResult[0].version}\n`);

    // Listar todas las tablas
    const [tables] = await connection.query('SHOW TABLES');
    const tableCount = tables.length;
    
    console.log(`${colors.bold}📊 Tablas en la base de datos:${colors.reset}`);
    console.log(`   ${colors.green}Total: ${tableCount} tablas${colors.reset}\n`);

    if (tableCount > 0) {
      // Obtener el nombre de la columna (varía según la BD)
      const tableKey = Object.keys(tables[0])[0];
      
      // Organizar tablas por módulo basado en el esquema descrito
      const modules = {
        'Usuarios y Seguridad': ['cuenta_usuario', 'cuenta_rol', 'usuario', 'rol', 'rol_permiso', 'permisos'],
        'Inventario': ['producto', 'almacen', 'sede', 'unidad', 'transferencia', 'detalle_transferencia'],
        'Ventas': ['comprobante_venta', 'detalle_comprobante', 'cliente', 'cotizacion', 'detalle_cotizacion', 'referencia_comprobante'],
        'Compras': ['orden_compra', 'detalle_orden_compra', 'proveedor'],
        'Promociones': ['promocion', 'descuento_aplicado', 'regla_promocion'],
        'Caja y Pagos': ['caja', 'movimiento_caja', 'pago']
      };

      const existingTables = tables.map(t => t[tableKey]);
      
      for (const [moduleName, moduleKeys] of Object.entries(modules)) {
        const moduleTables = existingTables.filter(table => moduleKeys.includes(table));
        if (moduleTables.length > 0) {
          console.log(`${colors.bold}${colors.blue}${moduleName} (${moduleTables.length}):${colors.reset}`);
          for (const table of moduleTables) {
            console.log(`   • ${table}`);
          }
          console.log();
        }
      }

      // Tablas no categorizadas
      const categorizedTables = Object.values(modules).flat();
      const uncategorizedTables = existingTables.filter(table => !categorizedTables.includes(table));
      
      if (uncategorizedTables.length > 0) {
        console.log(`${colors.bold}${colors.yellow}Otras tablas (${uncategorizedTables.length}):${colors.reset}`);
        for (const table of uncategorizedTables) {
          console.log(`   • ${table}`);
        }
        console.log();
      }

      // Contar registros en tablas principales
      console.log(`${colors.bold}📈 Registros en tablas principales:${colors.reset}`);
      
      const mainTables = ['cuenta_usuario', 'usuario', 'producto', 'cliente', 'proveedor'];
      
      for (const table of mainTables) {
        if (existingTables.includes(table)) {
          try {
            const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
            const count = countResult[0].count;
            const icon = count > 0 ? '✓' : '○';
            const color = count > 0 ? colors.green : colors.yellow;
            console.log(`   ${color}${icon} ${table}: ${count} registro(s)${colors.reset}`);
          } catch (error) {
            console.log(`   ${colors.red}✗ ${table}: Error al contar${colors.reset}`);
          }
        }
      }
      console.log();
    } else {
      console.log(`${colors.yellow}⚠️  La base de datos está vacía. No hay tablas creadas.${colors.reset}\n`);
    }

    console.log('='.repeat(60));
    console.log(`${colors.green}${colors.bold}✅ PRUEBA COMPLETADA EXITOSAMENTE${colors.reset}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log(`${colors.red}${colors.bold}✗ Error conectando a MySQL${colors.reset}\n`);
    console.log(`${colors.bold}❌ Detalles del error:${colors.reset}`);
    console.log(`   ${colors.red}Código:${colors.reset}   ${error.code || 'N/A'}`);
    console.log(`   ${colors.red}Mensaje:${colors.reset}  ${error.message}`);
    console.log();

    console.log(`${colors.bold}🔧 Posibles soluciones:${colors.reset}`);
    console.log(`   ${colors.cyan}1.${colors.reset} Verifica que MySQL esté corriendo`);
    console.log(`      Linux/Mac: ${colors.yellow}sudo systemctl status mysql${colors.reset}`);
    console.log(`      Windows:   Abre 'services.msc' y busca MySQL`);
    console.log();
    console.log(`   ${colors.cyan}2.${colors.reset} Verifica las credenciales en el archivo ${colors.yellow}.env${colors.reset}`);
    console.log(`      DB_HOST=${process.env.DB_HOST || 'localhost'}`);
    console.log(`      DB_USER=${process.env.DB_USER || 'root'}`);
    console.log(`      DB_NAME=${process.env.DB_NAME || 'mydb'}`);
    console.log();
    console.log(`   ${colors.cyan}3.${colors.reset} Verifica que la base de datos exista:`);
    console.log(`      ${colors.yellow}CREATE DATABASE IF NOT EXISTS mydb;${colors.reset}`);
    console.log();
    console.log(`   ${colors.cyan}4.${colors.reset} Verifica que el usuario tenga permisos:`);
    console.log(`      ${colors.yellow}GRANT ALL PRIVILEGES ON mydb.* TO 'root'@'localhost';${colors.reset}`);
    console.log();

    console.log('='.repeat(60));
    console.log(`${colors.red}${colors.bold}❌ PRUEBA FALLIDA${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Ejecutar la prueba
testConnection();
