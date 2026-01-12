# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a **MKapu Import Backend**! Este documento proporciona las pautas para contribuir al proyecto de manera efectiva.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#-código-de-conducta)
- [¿Cómo puedo contribuir?](#-cómo-puedo-contribuir)
- [Proceso de Desarrollo](#-proceso-de-desarrollo)
- [Configuración del Entorno](#️-configuración-del-entorno)
- [Convenciones de Código](#-convenciones-de-código)
- [Convenciones de Commits](#-convenciones-de-commits)
- [Estructura de Branches](#-estructura-de-branches)
- [Pull Request](#-pull-request)
- [Reportar Bugs](#-reportar-bugs)
- [Sugerir Mejoras](#-sugerir-mejoras)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas un ambiente respetuoso y constructivo para todos los colaboradores.

### Nuestros Estándares

- ✅ Usar lenguaje acogedor e inclusivo
- ✅ Respetar puntos de vista y experiencias diferentes
- ✅ Aceptar críticas constructivas con gracia
- ✅ Enfocarse en lo que es mejor para la comunidad
- ✅ Mostrar empatía hacia otros miembros

---

## 🎯 ¿Cómo puedo contribuir?

Hay muchas formas de contribuir al proyecto:

### 1. **Reportar Bugs** 🐛
Si encuentras un error, por favor repórtalo creando un issue con detalles claros.

### 2. **Sugerir Funcionalidades** 💡
¿Tienes una idea para mejorar el sistema? ¡Compártela!

### 3. **Mejorar Documentación** 📚
La documentación nunca está completa. Ayuda a mejorarla.

### 4. **Escribir Código** 💻
Implementa nuevas funcionalidades o corrige bugs existentes.

### 5. **Revisar Pull Requests** 👀
Ayuda revisando el código de otros contribuidores.

---

## 🔄 Proceso de Desarrollo

### 1. Fork del Proyecto

Haz un fork del repositorio a tu cuenta de GitHub:

```bash
# 1. Haz click en "Fork" en GitHub
# 2. Clona tu fork
git clone https://github.com/TU_USUARIO/MKapu_Import_Backend.git
cd MKapu_Import_Backend

# 3. Añade el repositorio original como upstream
git remote add upstream https://github.com/DominidM/MKapu_Import_Backend.git

# 4. Verifica los remotes
git remote -v
```

### 2. Mantén tu Fork Actualizado

```bash
# Obtener cambios del repositorio original
git fetch upstream

# Fusionar cambios en tu rama main
git checkout main
git merge upstream/main

# Subir los cambios a tu fork
git push origin main
```

---

## 🛠️ Configuración del Entorno

### Requisitos Previos

- Node.js v18+
- MySQL v8.0+
- Git

### Instalación

```bash
# 1. Navegar al directorio backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 4. Verificar conexión a BD
npm run test:db

# 5. Ejecutar en modo desarrollo
npm run dev:all
```

---

## 📝 Convenciones de Código

### JavaScript/Node.js

#### Estilo General

```javascript
// ✅ Usar const/let, no var
const API_URL = 'http://localhost:3000';
let userCount = 0;

// ✅ Nombres descriptivos en camelCase
const getUserById = (userId) => { /* ... */ };

// ✅ Clases en PascalCase
class UsuarioService { /* ... */ }

// ✅ Constantes en UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
```

#### Funciones Asíncronas

```javascript
// ✅ Usar async/await
async function fetchUser(id) {
  try {
    const user = await userRepository.findById(id);
    return user;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// ❌ Evitar callbacks anidados
```

#### Imports

```javascript
// ✅ Imports al inicio del archivo
import express from 'express';
import dotenv from 'dotenv';
import { verifyToken } from './middlewares/auth.middleware.js';

// ✅ Agrupar imports
// 1. Dependencias externas
// 2. Módulos internos
// 3. Archivos locales
```

#### Manejo de Errores

```javascript
// ✅ Siempre manejar errores
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('[ServiceName] Error:', error.message);
  throw new Error('Mensaje descriptivo del error');
}

// ✅ Logs descriptivos con prefijos
console.log('[Auth Service] Usuario autenticado:', userId);
console.error('[Database] Error de conexión:', error);
```

### Arquitectura Hexagonal

Mantén la separación de capas:

```
src/
├── domain/          # Lógica de negocio pura
│   ├── entity/      # Entidades de dominio
│   └── utils/       # Utilidades de dominio
├── application/     # Casos de uso
│   ├── service/     # Servicios de aplicación
│   └── mapper/      # Transformadores de datos
└── infrastructure/  # Adaptadores externos
    ├── controllers/ # Controladores HTTP/WS
    ├── routes/      # Rutas
    └── repository/  # Acceso a datos
```

### Base de Datos

```javascript
// ✅ Usar prepared statements
const [rows] = await pool.query(
  'SELECT * FROM usuarios WHERE id = ?',
  [userId]
);

// ❌ Nunca concatenar SQL directamente
// const query = `SELECT * FROM usuarios WHERE id = ${userId}`;
```

---

## 📝 Convenciones de Commits

Seguimos **Conventional Commits** para mensajes de commit claros y semánticos.

### Formato

```
<tipo>(<ámbito>): <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos de Commit

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(auth): agregar autenticación con Google` |
| `fix` | Corrección de bug | `fix(api): corregir error 500 en login` |
| `docs` | Cambios en documentación | `docs(readme): actualizar guía de instalación` |
| `style` | Formato, punto y coma, etc | `style(auth): formatear código según ESLint` |
| `refactor` | Refactorización de código | `refactor(user): optimizar consulta SQL` |
| `test` | Agregar o modificar tests | `test(auth): agregar tests para login` |
| `chore` | Tareas de mantenimiento | `chore(deps): actualizar dependencias` |
| `perf` | Mejoras de rendimiento | `perf(db): agregar índices a tabla usuarios` |
| `ci` | Cambios en CI/CD | `ci(github): agregar workflow de deploy` |

### Ejemplos

```bash
# Feature nueva
git commit -m "feat(admin): agregar endpoint para listar usuarios"

# Bug fix
git commit -m "fix(auth): corregir validación de token JWT"

# Documentación
git commit -m "docs(api): documentar endpoints de administración"

# Refactorización
git commit -m "refactor(database): migrar a pool de conexiones"

# Con cuerpo descriptivo
git commit -m "feat(websocket): agregar evento USUARIO_DELETED

- Emitir evento cuando se elimine un usuario
- Actualizar documentación de eventos WS
- Agregar tests para el nuevo evento"
```

---

## 🌿 Estructura de Branches

### Ramas Principales

- `main` - Rama principal (producción)
- `develop` - Rama de desarrollo

### Ramas de Features

Crea ramas con nombres descriptivos:

```bash
# Features
git checkout -b feature/nombre-descriptivo
# Ejemplo: feature/auth-google

# Bug fixes
git checkout -b fix/nombre-del-bug
# Ejemplo: fix/login-error-500

# Documentación
git checkout -b docs/que-documentar
# Ejemplo: docs/api-endpoints

# Hotfixes
git checkout -b hotfix/nombre-critico
# Ejemplo: hotfix/security-jwt
```

### Flujo de Trabajo

```bash
# 1. Crear nueva rama desde main
git checkout main
git pull upstream main
git checkout -b feature/mi-nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "feat(modulo): descripción del cambio"

# 3. Mantener la rama actualizada
git fetch upstream
git rebase upstream/main

# 4. Push a tu fork
git push origin feature/mi-nueva-funcionalidad

# 5. Crear Pull Request en GitHub
```

---

## 🔄 Pull Request

### Antes de Crear un PR

- ✅ Tu código sigue las convenciones del proyecto
- ✅ Has probado tu código localmente
- ✅ Los tests pasan (si aplica)
- ✅ Has actualizado la documentación si es necesario
- ✅ Tu rama está actualizada con main

### Crear un Pull Request

1. **Título Descriptivo**
   ```
   feat(auth): Agregar autenticación con Google OAuth
   ```

2. **Descripción Clara**
   ```markdown
   ## Descripción
   Implementa autenticación con Google OAuth para permitir login social.

   ## Cambios
   - Agregar estrategia de Passport para Google
   - Crear endpoint /auth/google
   - Actualizar documentación de API
   - Agregar variables de entorno necesarias

   ## Testing
   - [x] Probado localmente
   - [x] Login con Google funciona
   - [x] Token JWT se genera correctamente

   ## Checklist
   - [x] Código sigue las convenciones
   - [x] Documentación actualizada
   - [x] Sin errores de linting
   ```

3. **Vincular Issues**
   ```
   Closes #123
   Fixes #456
   ```

### Revisión del PR

- Responde a los comentarios de los revisores
- Haz los cambios solicitados
- Push los cambios a la misma rama (el PR se actualizará automáticamente)

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. Busca si el bug ya fue reportado en Issues
2. Verifica que uses la última versión
3. Intenta reproducir el bug

### Template de Bug Report

```markdown
## Descripción del Bug
Descripción clara y concisa del bug.

## Para Reproducir
Pasos para reproducir el comportamiento:
1. Ir a '...'
2. Hacer click en '....'
3. Ver error

## Comportamiento Esperado
Descripción de lo que esperabas que sucediera.

## Comportamiento Actual
Lo que realmente sucede.

## Screenshots
Si aplica, agrega screenshots.

## Entorno
- SO: [e.g. Ubuntu 22.04]
- Node.js: [e.g. v18.17.0]
- MySQL: [e.g. v8.0.34]

## Logs/Error Messages
```
Pega aquí los logs o mensajes de error
```

## Contexto Adicional
Cualquier otro contexto sobre el problema.
```

---

## 💡 Sugerir Mejoras

### Template de Feature Request

```markdown
## ¿Es tu feature request relacionado a un problema?
Descripción clara del problema. Ej: "Siempre me frustra cuando [...]"

## Describe la solución que te gustaría
Descripción clara y concisa de lo que quieres que suceda.

## Alternativas consideradas
Descripción de alternativas que has considerado.

## Contexto Adicional
Cualquier otro contexto, screenshots, o ejemplos.

## Beneficios
¿Qué beneficios traería esta funcionalidad?

## Impacto
¿Qué partes del sistema se verían afectadas?
```

---

## 📞 Contacto

¿Tienes preguntas? Puedes:

- Abrir un Issue con la etiqueta `question`
- Contactar al mantenedor: [@DominidM](https://github.com/DominidM)

---

## ⚖️ Licencia

Al contribuir al proyecto, aceptas que tus contribuciones serán licenciadas bajo la licencia ISC del proyecto.

---

<div align="center">

**¡Gracias por contribuir a MKapu Import Backend! 🎉**

Cada contribución, por pequeña que sea, es valiosa para el proyecto.

</div>
