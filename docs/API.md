# 📡 Documentación de API - MKapu Import Backend

Esta documentación describe todos los endpoints disponibles en el sistema backend de MKapu Import SJL.

---

## 📋 Tabla de Contenidos

- [Información General](#-información-general)
- [Autenticación](#-autenticación)
- [Auth Service](#-auth-service)
- [Admin Service](#-admin-service)
- [Códigos de Estado HTTP](#-códigos-de-estado-http)
- [Manejo de Errores](#-manejo-de-errores)
- [Ejemplos de Código](#-ejemplos-de-código)

---

## 🌐 Información General

### Base URL

```
http://localhost:3000
```

Todos los endpoints están disponibles a través del **API Gateway** en el puerto 3000, que enruta las peticiones a los microservicios correspondientes.

### Arquitectura de URLs

```
API Gateway (3000)
├── /api/auth/*    → Auth Service (3001)
└── /api/admin/*   → Admin Service (3003)
```

### Content-Type

Todos los endpoints aceptan y retornan:

```
Content-Type: application/json
```

---

## 🔐 Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para autenticación.

### Obtener Token

Para obtener un token, usa el endpoint de login:

```http
POST /api/auth/login
```

### Usar Token

Incluye el token en el header `Authorization` de tus peticiones:

```http
Authorization: Bearer <tu-token-jwt>
```

### Ejemplo

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔑 Auth Service

El **Auth Service** maneja la autenticación y autorización de usuarios.

**Base Path:** `/api/auth`

---

### POST `/api/auth/register`

Registra un nuevo usuario en el sistema.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "usuario123",
  "password": "Password123!",
  "email": "usuario@example.com",
  "id_rol": 1,
  "id_usuario": 1,
  "id_sede": 1
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `username` | string | ✅ | Nombre de usuario único |
| `password` | string | ✅ | Contraseña (mínimo 8 caracteres) |
| `email` | string | ✅ | Email válido del usuario |
| `id_rol` | number | ✅ | ID del rol (1=Admin, 2=Jefe Almacén, 3=Caja) |
| `id_usuario` | number | ✅ | ID del empleado asociado |
| `id_sede` | number | ❌ | ID de la sede (default: 1) |

#### Response

**Success (201 Created):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id_cuenta": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "El username ya existe"
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error al registrar usuario"
}
```

#### Ejemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "password": "MiPassword123!",
    "email": "juan.perez@mkapu.com",
    "id_rol": 1,
    "id_usuario": 5,
    "id_sede": 1
  }'
```

---

### POST `/api/auth/login`

Inicia sesión y obtiene un token JWT.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "usuario123",
  "password": "Password123!"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `username` | string | ✅ | Nombre de usuario |
| `password` | string | ✅ | Contraseña |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ1c3VhcmlvMTIzIiwicm9sIjoiQWRtaW5pc3RyYWRvciIsImlhdCI6MTYzMjE1MjcyMH0.abc123...",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "rol": "Administrador",
    "activo": true
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "message": "Usuario no encontrado"
}
```

#### Ejemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "password": "MiPassword123!"
  }'
```

---

### GET `/api/auth/profile`

Obtiene el perfil del usuario autenticado.

**🔒 Requiere Autenticación**

#### Request

**Headers:**
```
Authorization: Bearer <token>
```

#### Response

**Success (200 OK):**
```json
{
  "id": 1,
  "nombre_completo": "Juan Pérez García",
  "dni": "12345678",
  "email": "juan.perez@mkapu.com",
  "telefono": "987654321",
  "direccion": "Av. Principal 123, San Juan de Lurigancho",
  "username": "juan.perez",
  "ultimo_acceso": "2024-01-12T10:30:00.000Z",
  "rol": "Administrador"
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

**Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

#### Ejemplo cURL

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST `/api/auth/change-password`

Cambia la contraseña del usuario autenticado.

**🔒 Requiere Autenticación**

#### Request

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `oldPassword` | string | ✅ | Contraseña actual |
| `newPassword` | string | ✅ | Nueva contraseña (mínimo 8 caracteres) |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "La contraseña actual es incorrecta"
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

#### Ejemplo cURL

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Password123!",
    "newPassword": "NewPassword456!"
  }'
```

---

## 👥 Admin Service

El **Admin Service** maneja la gestión de usuarios y empleados del sistema.

**Base Path:** `/api/admin`

---

### POST `/api/admin/users`

Crea un nuevo usuario/empleado en el sistema.

**🔒 Requiere Autenticación** (próximamente)

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez García",
  "dni": "12345678",
  "correo": "juan.perez@mkapu.com",
  "telefono": "987654321",
  "direccion": "Av. Principal 123, San Juan de Lurigancho"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombres` | string | ✅ | Nombres del empleado |
| `apellidos` | string | ✅ | Apellidos del empleado |
| `dni` | string | ✅ | DNI (8 dígitos) |
| `correo` | string | ✅ | Email válido |
| `telefono` | string | ✅ | Número de teléfono |
| `direccion` | string | ✅ | Dirección completa |

#### Response

**Success (201 Created):**
```json
{
  "success": true,
  "message": "Empleado creado exitosamente",
  "data": {
    "id_usuario": 5,
    "nombres": "Juan",
    "apellidos": "Pérez García",
    "dni": "12345678",
    "correo": "juan.perez@mkapu.com",
    "telefono": "987654321",
    "direccion": "Av. Principal 123, San Juan de Lurigancho",
    "fecha_registro": "2024-01-12T10:30:00.000Z"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "El DNI ya está registrado"
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error al crear empleado"
}
```

#### Ejemplo cURL

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "María",
    "apellidos": "González López",
    "dni": "87654321",
    "correo": "maria.gonzalez@mkapu.com",
    "telefono": "912345678",
    "direccion": "Jr. Los Olivos 456, SJL"
  }'
```

---

### GET `/api/admin/users`

Lista todos los usuarios del sistema.

**🚧 Próximamente**

#### Response (Planificado)

```json
{
  "success": true,
  "data": [
    {
      "id_usuario": 1,
      "nombres": "Juan",
      "apellidos": "Pérez García",
      "dni": "12345678",
      "correo": "juan.perez@mkapu.com",
      "telefono": "987654321",
      "estado": "activo"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

### GET `/api/admin/users/:id`

Obtiene un usuario específico por ID.

**🚧 Próximamente**

---

### PUT `/api/admin/users/:id`

Actualiza la información de un usuario.

**🚧 Próximamente**

---

### DELETE `/api/admin/users/:id`

Elimina (desactiva) un usuario del sistema.

**🚧 Próximamente**

---

### GET `/api/admin/health`

Verifica el estado del Admin Service.

#### Response

**Success (200 OK):**
```json
{
  "status": "OK",
  "service": "Administration"
}
```

**Error (500 Internal Server Error):**
```json
{
  "status": "Error",
  "db": "Connection refused"
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Petición exitosa |
| `201` | Created | Recurso creado exitosamente |
| `400` | Bad Request | Error en los datos enviados |
| `401` | Unauthorized | No autenticado (falta token) |
| `403` | Forbidden | No autorizado (token inválido) |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (ej: username duplicado) |
| `500` | Internal Server Error | Error en el servidor |

---

## ⚠️ Manejo de Errores

### Formato de Error Estándar

Todos los errores siguen este formato:

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (solo en desarrollo)"
}
```

### Errores Comunes

#### 1. Token No Proporcionado

```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

**Solución:** Incluir header `Authorization: Bearer <token>`

#### 2. Token Inválido o Expirado

```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

**Solución:** Hacer login nuevamente para obtener un nuevo token

#### 3. Credenciales Inválidas

```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

**Solución:** Verificar username y password

#### 4. Datos Faltantes

```json
{
  "success": false,
  "message": "Faltan campos requeridos: username, password"
}
```

**Solución:** Enviar todos los campos requeridos

#### 5. Recurso No Encontrado

```json
{
  "success": false,
  "message": "Usuario no encontrado"
}
```

**Solución:** Verificar que el recurso exista

---

## 💻 Ejemplos de Código

### JavaScript (Fetch API)

#### Login y Obtener Perfil

```javascript
// 1. Login
async function login(username, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.success) {
      // Guardar token
      localStorage.setItem('token', data.token);
      console.log('Login exitoso:', data.user);
      return data.token;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
}

// 2. Obtener perfil
async function getProfile() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log('Perfil:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uso
await login('juan.perez', 'Password123!');
await getProfile();
```

#### Crear Empleado

```javascript
async function createEmployee(employeeData) {
  try {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(employeeData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Empleado creado:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
}

// Uso
createEmployee({
  nombres: 'María',
  apellidos: 'González',
  dni: '87654321',
  correo: 'maria@mkapu.com',
  telefono: '912345678',
  direccion: 'Jr. Los Olivos 456'
});
```

---

### Python (Requests)

```python
import requests

BASE_URL = 'http://localhost:3000'

# Login
def login(username, password):
    response = requests.post(
        f'{BASE_URL}/api/auth/login',
        json={'username': username, 'password': password}
    )
    
    data = response.json()
    if data.get('success'):
        return data['token']
    else:
        print(f"Error: {data.get('message')}")
        return None

# Obtener perfil
def get_profile(token):
    response = requests.get(
        f'{BASE_URL}/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    return response.json()

# Crear empleado
def create_employee(employee_data):
    response = requests.post(
        f'{BASE_URL}/api/admin/users',
        json=employee_data
    )
    
    return response.json()

# Uso
token = login('juan.perez', 'Password123!')
if token:
    profile = get_profile(token)
    print(profile)
    
    new_employee = create_employee({
        'nombres': 'María',
        'apellidos': 'González',
        'dni': '87654321',
        'correo': 'maria@mkapu.com',
        'telefono': '912345678',
        'direccion': 'Jr. Los Olivos 456'
    })
    print(new_employee)
```

---

### Node.js (Axios)

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Cliente con interceptor para token
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
async function login(username, password) {
  try {
    const response = await apiClient.post('/api/auth/login', {
      username,
      password
    });
    
    const { token } = response.data;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    console.error('Error en login:', error.response.data);
    throw error;
  }
}

// Obtener perfil
async function getProfile() {
  try {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Error al obtener perfil:', error.response.data);
    throw error;
  }
}

// Crear empleado
async function createEmployee(employeeData) {
  try {
    const response = await apiClient.post('/api/admin/users', employeeData);
    return response.data;
  } catch (error) {
    console.error('Error al crear empleado:', error.response.data);
    throw error;
  }
}

// Uso
(async () => {
  await login('juan.perez', 'Password123!');
  const profile = await getProfile();
  console.log(profile);
  
  const newEmployee = await createEmployee({
    nombres: 'María',
    apellidos: 'González',
    dni: '87654321',
    correo: 'maria@mkapu.com',
    telefono: '912345678',
    direccion: 'Jr. Los Olivos 456'
  });
  console.log(newEmployee);
})();
```

---

## 🔌 WebSocket

Ver documentación completa de WebSocket en [README.md - WebSocket](../README.md#-websocket)

### Conexión Básica

```javascript
const ws = new WebSocket('ws://localhost:3000/api/admin');

ws.onopen = () => {
  console.log('✓ Conectado');
};

ws.onmessage = (event) => {
  const { event: eventType, payload } = JSON.parse(event.data);
  console.log('Evento:', eventType, payload);
};
```

### Eventos Disponibles

- `LISTA_EMPLEADOS` - Lista de empleados
- `USUARIO_CREATED` - Usuario creado
- `USUARIO_UPDATED` - Usuario actualizado
- `USUARIO_DELETED` - Usuario eliminado

---

## 📚 Recursos Adicionales

- [README Principal](../README.md)
- [Guía de Contribución](../CONTRIBUTING.md)
- [Documentación de Base de Datos](./DATABASE.md)

---

<div align="center">

**📡 API Documentation v1.0**

Última actualización: Enero 2024

</div>
