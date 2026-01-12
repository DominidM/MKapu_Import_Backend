# 🏪 MKapu Import SJL - Sistema Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-v5.2.1-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-v3.16.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-v8.18.3-010101?style=for-the-badge&logo=websocket&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-v9.0.3-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![DDD](https://img.shields.io/badge/Architecture-DDD%20%2B%20Hexagonal-blue?style=for-the-badge)

**Sistema backend empresarial para gestión integral de MKapu Import SJL**

[🚀 Inicio Rápido](#-instalación) | [📖 Documentación](#-documentación) | [🔧 API](#-api-endpoints) | [👥 Contribuir](CONTRIBUTING.md)

</div>

---

## 📑 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [WebSocket](#-websocket)
- [Scripts Disponibles](#-scripts-disponibles)
- [Base de Datos](#-base-de-datos)
- [Seguridad](#-seguridad)
- [Documentación](#-documentación)
- [Troubleshooting](#-troubleshooting)
- [Autor](#-autor)
- [Licencia](#-licencia)

---

## 📄 Descripción

**MKapu Import Backend** es un sistema backend robusto y escalable desarrollado para **MKapu Import SJL**, implementando una arquitectura de microservicios con patrones de diseño avanzados como **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal**.

### ✨ Características principales:

- 🏗️ **Arquitectura de Microservicios** con API Gateway
- 🔐 **Autenticación JWT** y encriptación bcrypt
- 🔄 **WebSocket** para comunicación en tiempo real
- 🗄️ **Base de datos MySQL** con 27 tablas relacionales
- 📦 **Diseño modular** con separación de responsabilidades
- 🚀 **API RESTful** para operaciones CRUD
- 🎯 **Domain-Driven Design** para lógica de negocio clara
- 🛡️ **Middleware de autenticación** y control de roles

---

## 🏛️ Arquitectura

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│                    (Frontend/Mobile)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      API GATEWAY                             │
│                     (Puerto 3000)                            │
│                                                              │
│  • Enrutamiento de peticiones                               │
│  • Proxy a microservicios                                   │
│  • Soporte WebSocket                                        │
└──────────────┬────────────────────────────┬─────────────────┘
               │                            │
               │                            │
      ┌────────▼────────┐          ┌───────▼──────────┐
      │  AUTH SERVICE   │          │  ADMIN SERVICE   │
      │  (Puerto 3001)  │          │  (Puerto 3003)   │
      │                 │          │                  │
      │ • Login         │          │ • Usuarios       │
      │ • Register      │          │ • Empleados      │
      │ • Verify Token  │          │ • WebSocket      │
      │ • Change Pass   │          │ • Health Check   │
      └────────┬────────┘          └────────┬─────────┘
               │                            │
               │                            │
               └────────────┬───────────────┘
                            │
                            │
                   ┌────────▼────────┐
                   │   MySQL (mydb)  │
                   │  (Puerto 3306)  │
                   │                 │
                   │  • 27 tablas    │
                   │  • Relaciones   │
                   │  • Índices      │
                   └─────────────────┘
```

### 🎯 Arquitectura Hexagonal / DDD

El proyecto implementa **Arquitectura Hexagonal** con capas claramente definidas:

```
Microservicio
├── 📦 Domain (Núcleo)
│   ├── Entities: Modelos de negocio
│   └── Utils: Lógica de dominio
│
├── 🔧 Application (Casos de Uso)
│   ├── Services: Lógica de aplicación
│   └── Mappers: Transformación de datos
│
└── 🌐 Infrastructure (Adaptadores)
    ├── Controllers: Entrada HTTP/WS
    ├── Routes: Enrutamiento
    └── Repository: Acceso a datos
```

### 🚀 Microservicios

#### 1. **API Gateway** (Puerto 3000)
- Punto de entrada único para todas las peticiones
- Enruta solicitudes a microservicios correspondientes
- Maneja proxy HTTP y WebSocket
- Configuración CORS centralizada

#### 2. **Auth Service** (Puerto 3001)
- Gestión de autenticación y autorización
- Generación y validación de tokens JWT
- Registro de nuevos usuarios
- Cambio de contraseñas
- Control de acceso basado en roles

#### 3. **Admin Service** (Puerto 3003)
- Gestión de usuarios y empleados
- Operaciones CRUD completas
- Comunicación en tiempo real vía WebSocket
- Health checks para monitoreo

---

## 🛠️ Tecnologías

### Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Node.js** | v18+ | Runtime de JavaScript |
| **Express** | v5.2.1 | Framework web |
| **MySQL2** | v3.16.0 | Driver de base de datos |
| **JWT** | v9.0.3 | Autenticación con tokens |
| **Bcryptjs** | v3.0.3 | Encriptación de contraseñas |
| **ws** | v8.18.3 | WebSocket para tiempo real |
| **http-proxy-middleware** | v3.0.5 | Proxy en API Gateway |
| **dotenv** | v17.2.3 | Variables de entorno |
| **cors** | v2.8.5 | Control de CORS |

### Desarrollo

| Herramienta | Versión | Propósito |
|------------|---------|-----------|
| **Nodemon** | v3.1.11 | Hot reload en desarrollo |
| **Concurrently** | v9.2.1 | Ejecutar múltiples servicios |

---

## 📁 Estructura del Proyecto

```
MKapu_Import_Backend/
│
├── backend/
│   │
│   ├── api-gateway/                    # API Gateway (Puerto 3000)
│   │   └── index.js                    # Configuración de proxy
│   │
│   ├── microservices/
│   │   │
│   │   ├── auth/                       # Servicio de Autenticación
│   │   │   ├── src/
│   │   │   │   ├── application/        # Lógica de aplicación
│   │   │   │   │   └── AuthService.js
│   │   │   │   ├── domain/             # Entidades y lógica de negocio
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   └── cuenta_usuario.js
│   │   │   │   │   └── utils/
│   │   │   │   │       └── password.js
│   │   │   │   ├── infrastructure/     # Controladores y repos
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── auth.controller.js
│   │   │   │   │   ├── routes/
│   │   │   │   │   │   └── auth.routes.js
│   │   │   │   │   └── repository/
│   │   │   │   │       └── authRepository.js
│   │   │   │   └── index.js            # Entry point
│   │   │   └── package.json
│   │   │
│   │   └── administracion/             # Servicio de Administración
│   │       └── services/
│   │           ├── src/
│   │           │   ├── application/    # Servicios y mappers
│   │           │   │   ├── service/
│   │           │   │   │   └── empleadoService.js
│   │           │   │   └── mapper/
│   │           │   │       └── usuarioMapper.js
│   │           │   ├── domain/         # Entidades
│   │           │   │   └── entity/
│   │           │   │       └── usuario.js
│   │           │   ├── infrastructure/ # Controllers & repos
│   │           │   │   ├── controllers/
│   │           │   │   │   ├── rest/
│   │           │   │   │   │   └── usuario.controller.js
│   │           │   │   │   └── ws/
│   │           │   │   │       └── usuario.socket.controller.js
│   │           │   │   ├── routes/
│   │           │   │   │   └── usuarios.routes.js
│   │           │   │   └── repository/
│   │           │   │       └── usuarioRepository.js
│   │           │   └── index.js        # Entry point
│   │           └── package.json
│   │
│   ├── database/                       # Configuración de BD
│   │   └── config/
│   │       ├── database.js             # Pool de conexiones
│   │       └── test-connection.js      # Script de prueba
│   │
│   ├── shared/                         # Código compartido
│   │   ├── infrastructure/
│   │   │   ├── middlewares/
│   │   │   │   └── auth.middleware.js  # Verificación JWT
│   │   │   └── web-socket/
│   │   │       └── SocketServer.js     # Servidor WS
│   │   └── utils/
│   │       └── ConsulResolver.js
│   │
│   ├── package.json                    # Dependencias principales
│   └── .env.example                    # Template de variables
│
├── docs/                               # Documentación
│   ├── API.md                          # Documentación de API
│   └── DATABASE.md                     # Esquema de base de datos
│
├── README.md                           # Este archivo
├── CONTRIBUTING.md                     # Guía de contribución
└── .gitignore                          # Archivos ignorados
```

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18 o superior ([Descargar](https://nodejs.org/))
- **MySQL** v8.0 o superior ([Descargar](https://dev.mysql.com/downloads/))
- **Git** ([Descargar](https://git-scm.com/))
- **npm** o **yarn** (incluido con Node.js)

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DominidM/MKapu_Import_Backend.git
cd MKapu_Import_Backend
```

### 2. Instalar dependencias

```bash
cd backend
npm install
```

---

## ⚙️ Configuración

### 1. Configurar Base de Datos

#### Crear la base de datos `mydb`

```sql
-- Conectar a MySQL
mysql -u root -p

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE mydb;

-- (Aquí van tus scripts de creación de tablas)
-- Ver docs/DATABASE.md para el esquema completo
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus credenciales
nano .env  # o usa tu editor favorito
```

Configurar las siguientes variables en `.env`:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=mydb
DB_PORT=3306

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui

# Puertos de microservicios
GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
ADMIN_SERVICE_PORT=3003
```

### 3. Verificar Conexión a la Base de Datos

```bash
npm run test:db
```

Si todo está configurado correctamente, verás:

```
✓ Conexión a MySQL exitosa
  Base de datos: mydb
  Host: localhost:3306
  Usuario: root
  
✓ Tablas encontradas: 27
  • cuenta_usuario: 1 registros
  • producto: X registros
  • cliente: X registros
```

---

## 🎮 Uso

### Ejecutar todos los servicios simultáneamente

```bash
npm run dev:all
```

Esto iniciará:
- ✅ API Gateway en `http://localhost:3000`
- ✅ Auth Service en `http://localhost:3001`
- ✅ Admin Service en `http://localhost:3003`

### Ejecutar servicios individualmente

#### API Gateway
```bash
npm run dev
```

#### Auth Service
```bash
npm run dev:auth
```

#### Admin Service
```bash
npm run dev:admin
```

### Modo Producción

```bash
npm start
```

---

## 🌐 API Endpoints

### 🔐 Auth Service (`/api/auth`)

#### POST `/api/auth/register`
Registrar un nuevo usuario en el sistema.

**Request:**
```json
{
  "username": "usuario123",
  "password": "password123",
  "email": "usuario@example.com",
  "id_rol": 1,
  "id_usuario": 1,
  "id_sede": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id_cuenta": "uuid-generado"
  }
}
```

#### POST `/api/auth/login`
Iniciar sesión y obtener token JWT.

**Request:**
```json
{
  "username": "usuario123",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "rol": "Administrador"
  }
}
```

#### GET `/api/auth/profile`
Obtener perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "nombre_completo": "Juan Pérez",
  "dni": "12345678",
  "email": "juan@example.com",
  "telefono": "987654321",
  "rol": "Administrador"
}
```

#### POST `/api/auth/change-password`
Cambiar contraseña del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newPassword456"
}
```

### 👥 Admin Service (`/api/admin`)

#### GET `/api/admin/users`
Listar todos los usuarios (próximamente).

#### POST `/api/admin/users`
Crear un nuevo usuario/empleado.

**Request:**
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "dni": "12345678",
  "correo": "juan@example.com",
  "telefono": "987654321",
  "direccion": "Av. Principal 123"
}
```

### Ejemplos con cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario123","password":"password123"}'

# Obtener perfil
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <tu-token>"

# Crear empleado
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"nombres":"Juan","apellidos":"Pérez","dni":"12345678"}'
```

---

## 🔌 WebSocket

### Conexión

Conectar al WebSocket del Admin Service a través del Gateway:

```javascript
const ws = new WebSocket('ws://localhost:3000/api/admin');

ws.onopen = () => {
  console.log('✓ Conectado al WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento recibido:', data.event);
  console.log('Datos:', data.payload);
};
```

### Eventos Disponibles

#### Solicitar lista de empleados
```javascript
ws.send(JSON.stringify({
  action: 'LISTAR_EMPLEADOS'
}));
```

#### Recibir eventos
```javascript
ws.onmessage = (event) => {
  const { event, payload } = JSON.parse(event.data);
  
  switch(event) {
    case 'LISTA_EMPLEADOS':
      console.log('Empleados:', payload);
      break;
    case 'USUARIO_CREATED':
      console.log('Nuevo usuario:', payload);
      break;
    case 'USUARIO_UPDATED':
      console.log('Usuario actualizado:', payload);
      break;
    case 'USUARIO_DELETED':
      console.log('Usuario eliminado:', payload);
      break;
  }
};
```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia API Gateway en modo producción |
| `npm run dev` | Inicia API Gateway con hot reload |
| `npm run dev:auth` | Inicia Auth Service con hot reload |
| `npm run dev:admin` | Inicia Admin Service con hot reload |
| `npm run dev:all` | Inicia todos los servicios simultáneamente |
| `npm run test:db` | Verifica conexión a la base de datos |

---

## 🗄️ Base de Datos

El sistema utiliza la base de datos **`mydb`** con **27 tablas relacionales** organizadas por módulos:

### 📊 Módulos y Tablas

#### 👤 Usuarios y Seguridad (6 tablas)
- `cuenta_usuario` - Cuentas de acceso al sistema
- `cuenta_rol` - Relación entre cuentas y roles
- `usuario` - Información de empleados
- `rol` - Roles del sistema
- `rol_permiso` - Permisos por rol
- `permisos` - Catálogo de permisos

#### 📦 Inventario (7 tablas)
- `producto` - Catálogo de productos
- `almacen` - Almacenes de la empresa
- `sede` - Sedes físicas
- `unidad` - Unidades de medida
- `transferencia` - Transferencias entre almacenes
- `detalle_transferencia` - Detalle de transferencias

#### 🛒 Ventas (7 tablas)
- `comprobante_venta` - Facturas y boletas
- `detalle_comprobante` - Items de comprobantes
- `cliente` - Registro de clientes
- `cotizacion` - Cotizaciones a clientes
- `detalle_cotizacion` - Detalle de cotizaciones
- `referencia_comprobante` - Referencias entre documentos

#### 🏭 Compras (3 tablas)
- `orden_compra` - Órdenes de compra
- `detalle_orden_compra` - Detalle de órdenes
- `proveedor` - Registro de proveedores

#### 🎁 Promociones (3 tablas)
- `promocion` - Promociones activas
- `descuento_aplicado` - Descuentos aplicados
- `regla_promocion` - Reglas de promociones

#### 💰 Caja y Pagos (3 tablas)
- `caja` - Cajas registradoras
- `movimiento_caja` - Movimientos de efectivo
- `pago` - Registro de pagos

**Estado actual:** 1 cuenta de usuario registrada

📖 Ver [docs/DATABASE.md](docs/DATABASE.md) para el esquema completo y diagramas ER.

---

## 🛡️ Seguridad

### Autenticación JWT

El sistema utiliza **JSON Web Tokens (JWT)** para autenticación segura:

- Tokens firmados con secreto configurado en `JWT_SECRET`
- Expiración configurable de tokens
- Verificación de tokens en middleware
- Información del usuario codificada en el payload

### Encriptación de Contraseñas

- **Bcrypt** para hash de contraseñas
- Salt rounds: 10
- Las contraseñas nunca se almacenan en texto plano

### Middleware de Autenticación

```javascript
// Verificar token JWT
import { verifyToken } from './shared/infrastructure/middlewares/auth.middleware.js';

// Proteger rutas
router.get('/protected', verifyToken, (req, res) => {
  // req.user contiene los datos del usuario
});

// Control de roles
import { checkRole } from './shared/infrastructure/middlewares/auth.middleware.js';

router.get('/admin-only', 
  verifyToken, 
  checkRole('Administrador'), 
  (req, res) => {
    // Solo accesible por administradores
  }
);
```

### Buenas Prácticas Implementadas

- ✅ Variables de entorno para secretos
- ✅ CORS configurado correctamente
- ✅ Validación de entrada en controladores
- ✅ Manejo seguro de errores
- ✅ Logging de accesos y errores
- ✅ Conexiones a BD con pool

---

## 📚 Documentación

- **[API.md](docs/API.md)** - Documentación completa de endpoints con ejemplos
- **[DATABASE.md](docs/DATABASE.md)** - Esquema de base de datos y diagramas ER
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guía para contribuidores

---

## 🔧 Troubleshooting

### Error: Cannot connect to MySQL

**Problema:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Soluciones:**
1. Verificar que MySQL esté corriendo:
   ```bash
   # Linux/Mac
   sudo systemctl status mysql
   # Windows
   services.msc  # Buscar MySQL
   ```

2. Verificar credenciales en `.env`
3. Verificar que la base de datos `mydb` exista
4. Verificar que el usuario tenga permisos

### Error: JWT_SECRET is not defined

**Problema:** El token JWT no se puede generar

**Solución:**
1. Asegurarse de que `.env` existe
2. Verificar que `JWT_SECRET` esté definido
3. Reiniciar los servicios

### Error: Port 3000 already in use

**Problema:** El puerto ya está siendo utilizado

**Solución:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Error: Cannot find module

**Problema:** Faltan dependencias

**Solución:**
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Los servicios no arrancan con dev:all

**Problema:** Concurrently no funciona

**Solución:**
```bash
# Verificar instalación
npm list concurrently

# Reinstalar si es necesario
npm install concurrently --save-dev
```

### WebSocket no conecta

**Problema:** Error al conectar WebSocket

**Soluciones:**
1. Verificar que Admin Service esté corriendo
2. Usar la URL correcta: `ws://localhost:3000/api/admin`
3. Verificar logs del Gateway para errores de proxy
4. Probar conexión directa: `ws://localhost:3003`

---

## 👨‍💻 Autor

**DominidM**

- GitHub: [@DominidM](https://github.com/DominidM)
- Proyecto: [MKapu_Import_Backend](https://github.com/DominidM/MKapu_Import_Backend)

---

## 📄 Licencia

Este proyecto está bajo la Licencia **ISC**.

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella ⭐**

Hecho con ❤️ para MKapu Import SJL

</div>
