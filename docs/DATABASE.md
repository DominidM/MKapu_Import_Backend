# 🗄️ Documentación de Base de Datos - MKapu Import Backend

Esta documentación describe la estructura completa de la base de datos del sistema MKapu Import SJL.

---

## 📋 Tabla de Contenidos

- [Información General](#-información-general)
- [Diagrama de Relaciones](#-diagrama-de-relaciones)
- [Módulos y Tablas](#-módulos-y-tablas)
  - [Usuarios y Seguridad](#-usuarios-y-seguridad)
  - [Inventario](#-inventario)
  - [Ventas](#-ventas)
  - [Compras](#-compras)
  - [Promociones](#-promociones)
  - [Caja y Pagos](#-caja-y-pagos)
- [Índices y Optimización](#-índices-y-optimización)
- [Scripts de Creación](#-scripts-de-creación)
- [Datos de Ejemplo](#-datos-de-ejemplo)

---

## 🌐 Información General

### Configuración de la Base de Datos

- **Nombre:** `mydb`
- **Motor:** MySQL 8.0+
- **Charset:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`
- **Total de Tablas:** 27

### Convenciones

- **Nombres de tablas:** snake_case (minúsculas con guiones bajos)
- **Nombres de columnas:** snake_case
- **Primary Keys:** `id_[nombre_tabla]`
- **Foreign Keys:** `id_[tabla_referenciada]`
- **Timestamps:** Formato `DATETIME` para fechas

---

## 🔗 Diagrama de Relaciones

### Diagrama General (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│                    SISTEMA MKAPU IMPORT SJL                      │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    USUARIOS Y SEGURIDAD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐         ┌──────────────┐                        │
│   │   rol   │────────▶│ rol_permiso  │                        │
│   └────┬────┘         └──────┬───────┘                        │
│        │                     │                                 │
│        │              ┌──────▼────────┐                        │
│        │              │   permisos    │                        │
│        │              └───────────────┘                        │
│        │                                                        │
│   ┌────▼────────┐     ┌──────────────┐                        │
│   │ cuenta_rol  │◀────│cuenta_usuario│                        │
│   └─────────────┘     └──────┬───────┘                        │
│                              │                                 │
│                        ┌─────▼────┐                            │
│                        │ usuario  │                            │
│                        └──────────┘                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        INVENTARIO                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐                                                  │
│   │  sede   │───┐                                              │
│   └─────────┘   │                                              │
│                 │     ┌──────────┐                             │
│                 └────▶│ almacen  │◀────┐                       │
│                       └─────┬────┘     │                       │
│                             │          │                       │
│                       ┌─────▼────┐     │                       │
│                       │ producto │     │                       │
│                       └──────────┘     │                       │
│                             │          │                       │
│   ┌─────────┐              │    ┌─────┴───────────┐           │
│   │ unidad  │──────────────┘    │ transferencia   │           │
│   └─────────┘                   └─────┬───────────┘           │
│                                       │                        │
│                              ┌────────▼────────────┐           │
│                              │detalle_transferencia│           │
│                              └─────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           VENTAS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐                                                 │
│   │ cliente  │────┐                                            │
│   └──────────┘    │                                            │
│                   │                                            │
│              ┌────▼──────────────┐    ┌──────────────────┐    │
│              │ comprobante_venta │◀───│referencia_       │    │
│              └────┬──────────────┘    │comprobante       │    │
│                   │                   └──────────────────┘    │
│              ┌────▼────────────┐                              │
│              │detalle_         │                              │
│              │comprobante      │                              │
│              └─────────────────┘                              │
│                   │                                            │
│              ┌────▼──────┐                                     │
│              │ producto  │                                     │
│              └───────────┘                                     │
│                                                                 │
│   ┌──────────┐                                                 │
│   │ cliente  │────┐                                            │
│   └──────────┘    │                                            │
│                   │                                            │
│              ┌────▼──────────┐                                 │
│              │  cotizacion   │                                 │
│              └────┬──────────┘                                 │
│                   │                                            │
│              ┌────▼──────────┐                                 │
│              │detalle_       │                                 │
│              │cotizacion     │                                 │
│              └───────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         COMPRAS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────┐                                                │
│   │ proveedor │────┐                                           │
│   └───────────┘    │                                           │
│                    │                                           │
│               ┌────▼────────────┐                              │
│               │ orden_compra    │                              │
│               └────┬────────────┘                              │
│                    │                                           │
│               ┌────▼─────────────────┐                         │
│               │detalle_orden_compra  │                         │
│               └──────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PROMOCIONES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌──────────────┐                                  │
│              │  promocion   │                                  │
│              └────┬─────────┘                                  │
│                   │                                            │
│        ┌──────────┴──────────┐                                 │
│        │                     │                                 │
│   ┌────▼────────────┐  ┌────▼────────────┐                    │
│   │regla_promocion  │  │descuento_       │                    │
│   └─────────────────┘  │aplicado         │                    │
│                        └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CAJA Y PAGOS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐                                                 │
│   │   caja   │────┐                                            │
│   └──────────┘    │                                            │
│                   │                                            │
│              ┌────▼──────────────┐                             │
│              │ movimiento_caja   │                             │
│              └───────────────────┘                             │
│                                                                 │
│   ┌────────────────────┐                                       │
│   │comprobante_venta   │────┐                                  │
│   └────────────────────┘    │                                  │
│                             │                                  │
│                        ┌────▼────┐                             │
│                        │  pago   │                             │
│                        └─────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos y Tablas

### 👤 Usuarios y Seguridad

Este módulo gestiona la autenticación, autorización y control de acceso.

#### Tablas (6)

---

#### `cuenta_usuario`

**Descripción:** Cuentas de acceso al sistema con credenciales de autenticación.

**Columnas:**

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_cuenta` | VARCHAR(36) | NO | | UUID de la cuenta |
| `username` | VARCHAR(50) | NO | | Nombre de usuario único |
| `password` | VARCHAR(255) | NO | | Contraseña encriptada (bcrypt) |
| `email_emp` | VARCHAR(100) | NO | | Email del empleado |
| `id_usuario` | INT | YES | NULL | FK a `usuario` |
| `id_sede` | INT | YES | NULL | FK a `sede` |
| `ultimo_acceso` | DATETIME | YES | NULL | Última fecha de acceso |
| `estado` | ENUM('ACTIVO','INACTIVO') | NO | 'ACTIVO' | Estado de la cuenta |

**Índices:**
- PRIMARY KEY (`id_cuenta`)
- UNIQUE (`username`)
- INDEX (`id_usuario`)
- INDEX (`id_sede`)

---

#### `cuenta_rol`

**Descripción:** Relación muchos a muchos entre cuentas y roles.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_cuenta` | VARCHAR(36) | NO | FK a `cuenta_usuario` |
| `id_rol` | INT | NO | FK a `rol` |

**Índices:**
- PRIMARY KEY (`id_cuenta`, `id_rol`)

---

#### `usuario`

**Descripción:** Información personal de empleados del sistema.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_usuario` | INT | NO | ID único (auto-increment) |
| `nombres` | VARCHAR(100) | NO | Nombres del empleado |
| `apellidos` | VARCHAR(100) | NO | Apellidos del empleado |
| `dni` | VARCHAR(8) | NO | DNI único (8 dígitos) |
| `correo` | VARCHAR(100) | NO | Email personal |
| `telefono` | VARCHAR(15) | YES | Teléfono de contacto |
| `direccion` | TEXT | YES | Dirección completa |
| `fecha_registro` | DATETIME | NO | CURRENT_TIMESTAMP | Fecha de registro |
| `id_cuenta_usuario` | VARCHAR(36) | YES | FK a `cuenta_usuario` |

**Índices:**
- PRIMARY KEY (`id_usuario`)
- UNIQUE (`dni`)
- INDEX (`id_cuenta_usuario`)

---

#### `rol`

**Descripción:** Roles del sistema para control de acceso.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_rol` | INT | NO | ID único (auto-increment) |
| `nombre` | VARCHAR(50) | NO | Nombre del rol (ej: Administrador) |
| `descripcion` | TEXT | YES | Descripción del rol |
| `activo` | BOOLEAN | NO | TRUE | Estado del rol |

**Índices:**
- PRIMARY KEY (`id_rol`)
- UNIQUE (`nombre`)

**Roles Predeterminados:**
- Administrador
- Jefe_almacen
- Caja

---

#### `rol_permiso`

**Descripción:** Relación entre roles y permisos.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_rol` | INT | NO | FK a `rol` |
| `id_permiso` | INT | NO | FK a `permisos` |

**Índices:**
- PRIMARY KEY (`id_rol`, `id_permiso`)

---

#### `permisos`

**Descripción:** Catálogo de permisos del sistema.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_permiso` | INT | NO | ID único (auto-increment) |
| `nombre` | VARCHAR(50) | NO | Nombre del permiso |
| `descripcion` | TEXT | YES | Descripción del permiso |
| `modulo` | VARCHAR(50) | YES | Módulo al que pertenece |

**Índices:**
- PRIMARY KEY (`id_permiso`)
- UNIQUE (`nombre`)

---

### 📦 Inventario

Este módulo gestiona productos, almacenes y transferencias.

#### Tablas (7)

---

#### `producto`

**Descripción:** Catálogo de productos de la empresa.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_producto` | INT | NO | ID único (auto-increment) |
| `codigo` | VARCHAR(50) | NO | Código único del producto |
| `nombre` | VARCHAR(200) | NO | Nombre del producto |
| `descripcion` | TEXT | YES | Descripción detallada |
| `precio_compra` | DECIMAL(10,2) | NO | Precio de compra |
| `precio_venta` | DECIMAL(10,2) | NO | Precio de venta |
| `stock_minimo` | INT | NO | Stock mínimo requerido |
| `id_unidad` | INT | YES | FK a `unidad` |
| `id_almacen` | INT | YES | FK a `almacen` |
| `activo` | BOOLEAN | NO | TRUE | Producto activo/inactivo |
| `fecha_registro` | DATETIME | NO | CURRENT_TIMESTAMP |

**Índices:**
- PRIMARY KEY (`id_producto`)
- UNIQUE (`codigo`)
- INDEX (`id_unidad`)
- INDEX (`id_almacen`)

---

#### `almacen`

**Descripción:** Almacenes donde se guardan los productos.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_almacen` | INT | NO | ID único (auto-increment) |
| `nombre` | VARCHAR(100) | NO | Nombre del almacén |
| `direccion` | TEXT | YES | Dirección del almacén |
| `id_sede` | INT | YES | FK a `sede` |
| `capacidad` | INT | YES | Capacidad máxima |
| `activo` | BOOLEAN | NO | TRUE | Almacén activo/inactivo |

**Índices:**
- PRIMARY KEY (`id_almacen`)
- INDEX (`id_sede`)

---

#### `sede`

**Descripción:** Sedes físicas de la empresa.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_sede` | INT | NO | ID único (auto-increment) |
| `nombre` | VARCHAR(100) | NO | Nombre de la sede |
| `direccion` | TEXT | YES | Dirección completa |
| `telefono` | VARCHAR(15) | YES | Teléfono de contacto |
| `email` | VARCHAR(100) | YES | Email de contacto |
| `activo` | BOOLEAN | NO | TRUE | Sede activa/inactiva |

**Índices:**
- PRIMARY KEY (`id_sede`)

---

#### `unidad`

**Descripción:** Unidades de medida para productos.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_unidad` | INT | NO | ID único (auto-increment) |
| `nombre` | VARCHAR(50) | NO | Nombre (ej: Unidad, Caja, Kg) |
| `abreviatura` | VARCHAR(10) | NO | Abreviatura (ej: UND, CAJ, KG) |
| `descripcion` | TEXT | YES | Descripción |

**Índices:**
- PRIMARY KEY (`id_unidad`)
- UNIQUE (`abreviatura`)

---

#### `transferencia`

**Descripción:** Transferencias de productos entre almacenes.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_transferencia` | INT | NO | ID único (auto-increment) |
| `id_almacen_origen` | INT | NO | FK a `almacen` origen |
| `id_almacen_destino` | INT | NO | FK a `almacen` destino |
| `id_usuario` | INT | YES | FK a `usuario` que realiza |
| `fecha_transferencia` | DATETIME | NO | CURRENT_TIMESTAMP |
| `estado` | ENUM('PENDIENTE','EN_TRANSITO','COMPLETADA','CANCELADA') | NO | 'PENDIENTE' |
| `observaciones` | TEXT | YES | Observaciones |

**Índices:**
- PRIMARY KEY (`id_transferencia`)
- INDEX (`id_almacen_origen`)
- INDEX (`id_almacen_destino`)
- INDEX (`id_usuario`)

---

#### `detalle_transferencia`

**Descripción:** Detalle de productos en cada transferencia.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_detalle` | INT | NO | ID único (auto-increment) |
| `id_transferencia` | INT | NO | FK a `transferencia` |
| `id_producto` | INT | NO | FK a `producto` |
| `cantidad` | INT | NO | Cantidad transferida |
| `observaciones` | TEXT | YES | Observaciones del item |

**Índices:**
- PRIMARY KEY (`id_detalle`)
- INDEX (`id_transferencia`)
- INDEX (`id_producto`)

---

### 🛒 Ventas

Este módulo gestiona comprobantes, clientes y cotizaciones.

#### Tablas (7)

---

#### `comprobante_venta`

**Descripción:** Facturas, boletas y otros comprobantes de venta.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_comprobante` | INT | NO | ID único (auto-increment) |
| `tipo_comprobante` | ENUM('FACTURA','BOLETA','NOTA_CREDITO','NOTA_DEBITO') | NO |
| `serie` | VARCHAR(10) | NO | Serie del comprobante |
| `numero` | VARCHAR(20) | NO | Número correlativo |
| `id_cliente` | INT | YES | FK a `cliente` |
| `id_usuario` | INT | YES | FK a `usuario` vendedor |
| `fecha_emision` | DATETIME | NO | CURRENT_TIMESTAMP |
| `subtotal` | DECIMAL(10,2) | NO | Subtotal sin IGV |
| `igv` | DECIMAL(10,2) | NO | Monto de IGV |
| `total` | DECIMAL(10,2) | NO | Total a pagar |
| `estado` | ENUM('EMITIDO','ANULADO','PAGADO') | NO | 'EMITIDO' |

**Índices:**
- PRIMARY KEY (`id_comprobante`)
- UNIQUE (`serie`, `numero`)
- INDEX (`id_cliente`)
- INDEX (`id_usuario`)

---

#### `detalle_comprobante`

**Descripción:** Items/líneas de cada comprobante.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_detalle` | INT | NO | ID único (auto-increment) |
| `id_comprobante` | INT | NO | FK a `comprobante_venta` |
| `id_producto` | INT | NO | FK a `producto` |
| `cantidad` | INT | NO | Cantidad vendida |
| `precio_unitario` | DECIMAL(10,2) | NO | Precio unitario |
| `descuento` | DECIMAL(10,2) | NO | 0.00 | Descuento aplicado |
| `subtotal` | DECIMAL(10,2) | NO | Subtotal de la línea |

**Índices:**
- PRIMARY KEY (`id_detalle`)
- INDEX (`id_comprobante`)
- INDEX (`id_producto`)

---

#### `cliente`

**Descripción:** Registro de clientes.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_cliente` | INT | NO | ID único (auto-increment) |
| `tipo_documento` | ENUM('DNI','RUC','CE','PASAPORTE') | NO |
| `numero_documento` | VARCHAR(20) | NO | Número de documento |
| `nombres` | VARCHAR(100) | YES | Nombres (persona natural) |
| `apellidos` | VARCHAR(100) | YES | Apellidos (persona natural) |
| `razon_social` | VARCHAR(200) | YES | Razón social (empresa) |
| `direccion` | TEXT | YES | Dirección |
| `telefono` | VARCHAR(15) | YES | Teléfono |
| `email` | VARCHAR(100) | YES | Email |
| `activo` | BOOLEAN | NO | TRUE |
| `fecha_registro` | DATETIME | NO | CURRENT_TIMESTAMP |

**Índices:**
- PRIMARY KEY (`id_cliente`)
- UNIQUE (`tipo_documento`, `numero_documento`)

---

#### `cotizacion`

**Descripción:** Cotizaciones a clientes.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_cotizacion` | INT | NO | ID único (auto-increment) |
| `codigo` | VARCHAR(20) | NO | Código único |
| `id_cliente` | INT | YES | FK a `cliente` |
| `id_usuario` | INT | YES | FK a `usuario` vendedor |
| `fecha_emision` | DATETIME | NO | CURRENT_TIMESTAMP |
| `fecha_vencimiento` | DATE | YES | Fecha de vencimiento |
| `subtotal` | DECIMAL(10,2) | NO |
| `igv` | DECIMAL(10,2) | NO |
| `total` | DECIMAL(10,2) | NO |
| `estado` | ENUM('PENDIENTE','ACEPTADA','RECHAZADA','VENCIDA') | NO | 'PENDIENTE' |
| `observaciones` | TEXT | YES |

**Índices:**
- PRIMARY KEY (`id_cotizacion`)
- UNIQUE (`codigo`)
- INDEX (`id_cliente`)
- INDEX (`id_usuario`)

---

#### `detalle_cotizacion`

**Descripción:** Items de cada cotización.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_detalle` | INT | NO | ID único (auto-increment) |
| `id_cotizacion` | INT | NO | FK a `cotizacion` |
| `id_producto` | INT | NO | FK a `producto` |
| `cantidad` | INT | NO | Cantidad cotizada |
| `precio_unitario` | DECIMAL(10,2) | NO | Precio unitario |
| `descuento` | DECIMAL(10,2) | NO | 0.00 |
| `subtotal` | DECIMAL(10,2) | NO |

**Índices:**
- PRIMARY KEY (`id_detalle`)
- INDEX (`id_cotizacion`)
- INDEX (`id_producto`)

---

#### `referencia_comprobante`

**Descripción:** Referencias entre comprobantes (ej: NC referencia a Factura).

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_referencia` | INT | NO | ID único (auto-increment) |
| `id_comprobante_origen` | INT | NO | FK comprobante original |
| `id_comprobante_referencia` | INT | NO | FK comprobante que referencia |
| `tipo_referencia` | ENUM('NOTA_CREDITO','NOTA_DEBITO','GUIA_REMISION') | NO |
| `motivo` | TEXT | YES | Motivo de la referencia |

**Índices:**
- PRIMARY KEY (`id_referencia`)
- INDEX (`id_comprobante_origen`)
- INDEX (`id_comprobante_referencia`)

---

### 🏭 Compras

Este módulo gestiona órdenes de compra y proveedores.

#### Tablas (3)

---

#### `orden_compra`

**Descripción:** Órdenes de compra a proveedores.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_orden` | INT | NO | ID único (auto-increment) |
| `codigo` | VARCHAR(20) | NO | Código único |
| `id_proveedor` | INT | NO | FK a `proveedor` |
| `id_usuario` | INT | YES | FK a `usuario` comprador |
| `fecha_orden` | DATETIME | NO | CURRENT_TIMESTAMP |
| `fecha_entrega_estimada` | DATE | YES |
| `subtotal` | DECIMAL(10,2) | NO |
| `igv` | DECIMAL(10,2) | NO |
| `total` | DECIMAL(10,2) | NO |
| `estado` | ENUM('PENDIENTE','APROBADA','RECIBIDA','CANCELADA') | NO | 'PENDIENTE' |
| `observaciones` | TEXT | YES |

**Índices:**
- PRIMARY KEY (`id_orden`)
- UNIQUE (`codigo`)
- INDEX (`id_proveedor`)
- INDEX (`id_usuario`)

---

#### `detalle_orden_compra`

**Descripción:** Items de cada orden de compra.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_detalle` | INT | NO | ID único (auto-increment) |
| `id_orden` | INT | NO | FK a `orden_compra` |
| `id_producto` | INT | NO | FK a `producto` |
| `cantidad` | INT | NO | Cantidad solicitada |
| `precio_unitario` | DECIMAL(10,2) | NO | Precio de compra |
| `subtotal` | DECIMAL(10,2) | NO |

**Índices:**
- PRIMARY KEY (`id_detalle`)
- INDEX (`id_orden`)
- INDEX (`id_producto`)

---

#### `proveedor`

**Descripción:** Registro de proveedores.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_proveedor` | INT | NO | ID único (auto-increment) |
| `ruc` | VARCHAR(11) | NO | RUC único |
| `razon_social` | VARCHAR(200) | NO | Razón social |
| `nombre_comercial` | VARCHAR(200) | YES | Nombre comercial |
| `direccion` | TEXT | YES | Dirección |
| `telefono` | VARCHAR(15) | YES | Teléfono |
| `email` | VARCHAR(100) | YES | Email |
| `contacto_nombre` | VARCHAR(100) | YES | Nombre del contacto |
| `activo` | BOOLEAN | NO | TRUE |
| `fecha_registro` | DATETIME | NO | CURRENT_TIMESTAMP |

**Índices:**
- PRIMARY KEY (`id_proveedor`)
- UNIQUE (`ruc`)

---

### 🎁 Promociones

Este módulo gestiona promociones y descuentos.

#### Tablas (3)

---

#### `promocion`

**Descripción:** Promociones activas del sistema.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_promocion` | INT | NO | ID único (auto-increment) |
| `codigo` | VARCHAR(50) | NO | Código único |
| `nombre` | VARCHAR(200) | NO | Nombre de la promoción |
| `descripcion` | TEXT | YES | Descripción |
| `tipo_descuento` | ENUM('PORCENTAJE','MONTO_FIJO') | NO |
| `valor_descuento` | DECIMAL(10,2) | NO | Valor del descuento |
| `fecha_inicio` | DATE | NO | Fecha de inicio |
| `fecha_fin` | DATE | NO | Fecha de fin |
| `activo` | BOOLEAN | NO | TRUE |

**Índices:**
- PRIMARY KEY (`id_promocion`)
- UNIQUE (`codigo`)

---

#### `descuento_aplicado`

**Descripción:** Descuentos aplicados a comprobantes.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_descuento` | INT | NO | ID único (auto-increment) |
| `id_comprobante` | INT | NO | FK a `comprobante_venta` |
| `id_promocion` | INT | YES | FK a `promocion` |
| `monto_descuento` | DECIMAL(10,2) | NO | Monto descontado |
| `fecha_aplicacion` | DATETIME | NO | CURRENT_TIMESTAMP |

**Índices:**
- PRIMARY KEY (`id_descuento`)
- INDEX (`id_comprobante`)
- INDEX (`id_promocion`)

---

#### `regla_promocion`

**Descripción:** Reglas y condiciones de cada promoción.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_regla` | INT | NO | ID único (auto-increment) |
| `id_promocion` | INT | NO | FK a `promocion` |
| `tipo_regla` | ENUM('PRODUCTO_ESPECIFICO','CATEGORIA','MONTO_MINIMO','CANTIDAD_MINIMA') | NO |
| `valor_regla` | VARCHAR(100) | YES | Valor de la condición |
| `descripcion` | TEXT | YES |

**Índices:**
- PRIMARY KEY (`id_regla`)
- INDEX (`id_promocion`)

---

### 💰 Caja y Pagos

Este módulo gestiona cajas registradoras y pagos.

#### Tablas (3)

---

#### `caja`

**Descripción:** Cajas registradoras del sistema.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_caja` | INT | NO | ID único (auto-increment) |
| `nombre` | VARCHAR(100) | NO | Nombre de la caja |
| `id_sede` | INT | YES | FK a `sede` |
| `monto_inicial` | DECIMAL(10,2) | NO | 0.00 | Monto inicial |
| `monto_actual` | DECIMAL(10,2) | NO | 0.00 | Monto actual |
| `estado` | ENUM('ABIERTA','CERRADA') | NO | 'CERRADA' |
| `fecha_apertura` | DATETIME | YES |
| `fecha_cierre` | DATETIME | YES |

**Índices:**
- PRIMARY KEY (`id_caja`)
- INDEX (`id_sede`)

---

#### `movimiento_caja`

**Descripción:** Movimientos de efectivo en cada caja.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_movimiento` | INT | NO | ID único (auto-increment) |
| `id_caja` | INT | NO | FK a `caja` |
| `tipo_movimiento` | ENUM('INGRESO','EGRESO','APERTURA','CIERRE') | NO |
| `monto` | DECIMAL(10,2) | NO | Monto del movimiento |
| `concepto` | VARCHAR(200) | YES | Concepto/motivo |
| `id_usuario` | INT | YES | FK a `usuario` responsable |
| `fecha_movimiento` | DATETIME | NO | CURRENT_TIMESTAMP |

**Índices:**
- PRIMARY KEY (`id_movimiento`)
- INDEX (`id_caja`)
- INDEX (`id_usuario`)

---

#### `pago`

**Descripción:** Pagos realizados a comprobantes.

**Columnas:**

| Columna | Tipo | Null | Descripción |
|---------|------|------|-------------|
| `id_pago` | INT | NO | ID único (auto-increment) |
| `id_comprobante` | INT | NO | FK a `comprobante_venta` |
| `metodo_pago` | ENUM('EFECTIVO','TARJETA','TRANSFERENCIA','YAPE','PLIN') | NO |
| `monto` | DECIMAL(10,2) | NO | Monto pagado |
| `fecha_pago` | DATETIME | NO | CURRENT_TIMESTAMP |
| `numero_operacion` | VARCHAR(50) | YES | Número de operación/transacción |
| `observaciones` | TEXT | YES |

**Índices:**
- PRIMARY KEY (`id_pago`)
- INDEX (`id_comprobante`)

---

## 🚀 Índices y Optimización

### Índices Principales

Todas las tablas tienen:
- **Primary Key** en su columna `id_[tabla]`
- **Índices en Foreign Keys** para optimizar JOINs
- **Índices UNIQUE** en campos que deben ser únicos (username, dni, ruc, etc.)

### Optimizaciones Aplicadas

1. **InnoDB Engine:** Para soporte de transacciones y foreign keys
2. **utf8mb4:** Para soporte completo de caracteres Unicode
3. **Índices compuestos:** En campos frecuentemente consultados juntos
4. **DECIMAL para montos:** Precisión exacta en cálculos monetarios

---

## 📝 Scripts de Creación

### Crear Base de Datos

```sql
CREATE DATABASE IF NOT EXISTS mydb 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE mydb;
```

### Ejemplo: Crear Tabla Usuario

```sql
CREATE TABLE usuario (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  dni VARCHAR(8) NOT NULL,
  correo VARCHAR(100) NOT NULL,
  telefono VARCHAR(15),
  direccion TEXT,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_cuenta_usuario VARCHAR(36),
  PRIMARY KEY (id_usuario),
  UNIQUE KEY unique_dni (dni),
  INDEX idx_cuenta (id_cuenta_usuario),
  CONSTRAINT fk_usuario_cuenta FOREIGN KEY (id_cuenta_usuario) 
    REFERENCES cuenta_usuario(id_cuenta) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📊 Datos de Ejemplo

### Insertar Roles

```sql
INSERT INTO rol (nombre, descripcion, activo) VALUES
('Administrador', 'Acceso completo al sistema', TRUE),
('Jefe_almacen', 'Gestión de inventario y almacenes', TRUE),
('Caja', 'Gestión de ventas y caja', TRUE);
```

### Insertar Unidades de Medida

```sql
INSERT INTO unidad (nombre, abreviatura, descripcion) VALUES
('Unidad', 'UND', 'Producto individual'),
('Caja', 'CAJ', 'Caja con múltiples unidades'),
('Kilogramo', 'KG', 'Kilogramo'),
('Litro', 'LT', 'Litro'),
('Docena', 'DOC', 'Docena de unidades');
```

### Crear Usuario Administrador

```sql
-- 1. Insertar empleado
INSERT INTO usuario (nombres, apellidos, dni, correo, telefono, direccion) 
VALUES ('Admin', 'Sistema', '00000000', 'admin@mkapu.com', '999999999', 'Lima, Perú');

-- 2. Crear cuenta (nota: password debe estar hasheado con bcrypt)
INSERT INTO cuenta_usuario (id_cuenta, username, password, email_emp, id_usuario, id_sede, estado)
VALUES 
  (UUID(), 'admin', '$2a$10$hashedpassword...', 'admin@mkapu.com', 1, 1, 'ACTIVO');

-- 3. Asignar rol
INSERT INTO cuenta_rol (id_cuenta, id_rol) 
VALUES ((SELECT id_cuenta FROM cuenta_usuario WHERE username = 'admin'), 1);
```

---

## 🔍 Consultas Útiles

### Ver todas las tablas

```sql
SHOW TABLES;
```

### Contar registros por tabla

```sql
SELECT 
  TABLE_NAME,
  TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
ORDER BY TABLE_NAME;
```

### Verificar estructura de una tabla

```sql
DESCRIBE usuario;
-- o
SHOW CREATE TABLE usuario;
```

### Ver foreign keys

```sql
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'mydb' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 📚 Recursos Adicionales

- [README Principal](../README.md)
- [Documentación de API](./API.md)
- [Guía de Contribución](../CONTRIBUTING.md)

---

<div align="center">

**🗄️ Database Documentation v1.0**

Última actualización: Enero 2024

</div>
