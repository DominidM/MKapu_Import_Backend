# TRANSFERENCES API (Logistics)

## Índice
1. [Contexto y alcance](#contexto-y-alcance)
2. [Autenticación y autorización](#autenticación-y-autorización)
3. [Estados permitidos](#estados-permitidos)
4. [Endpoints](#endpoints)
5. [Flujo funcional (CU-04)](#flujo-funcional-cu-04)
6. [Endpoints adicionales relacionados](#endpoints-adicionales-relacionados)
7. [Notas técnicas](#notas-técnicas)

## Contexto y alcance
Documentación técnica de transferencias en el monorepo NestJS (Gateway + servicio `logistics`), basada en código real:
- Gateway: `apps/api-gateway/src/main.ts`
- Controller: `apps/logistics/src/core/warehouse/transfer/infrastructure/adapters/in/controllers/transfer-rest.controller.ts`
- Servicio: `apps/logistics/src/core/warehouse/transfer/application/service/transfer-command.service.ts`
- Repositorio/mapper: `.../transfer.repository.ts`, `.../transfer-mapper.ts`
- Dominio: `.../transfer-domain-entity.ts`

Rutas finales documentadas (vía gateway):
1. `POST /logistics/warehouse/transfer/request`
2. `PATCH /logistics/warehouse/transfer/:id/approve`
3. `PATCH /logistics/warehouse/transfer/:id/reject`
4. `PATCH /logistics/warehouse/transfer/:id/confirm-receipt`
5. `GET /logistics/warehouse/transfer/headquarters/:hqId`
6. `GET /logistics/warehouse/transfer`
7. `GET /logistics/warehouse/transfer/:id`

## Autenticación y autorización
`api-gateway` solo proxya `/logistics/*` a logistics (`pathRewrite: '^/logistics' -> ''`).

En controller de transferencias se usa `@UseGuards(RoleGuard)` a nivel clase.

Reglas reales por endpoint:
1. Endpoints con `@Roles(...)`:
- Requieren header `x-role`.
- `RoleGuard` responde `401` si falta `x-role`.
- `RoleGuard` responde `403` si el rol no coincide con los permitidos.
- `Authorization: Bearer ...` no es validado por `JwtAuthGuard` en este módulo (no está aplicado aquí).

2. Endpoints sin `@Roles(...)` (los `GET` de transferencias):
- `RoleGuard` permite acceso al no existir roles requeridos en el handler.
- No se exige `x-role` en esos métodos.

Headers usados:
- `Content-Type: application/json`.
- `x-role: JEFE DE ALMACEN | ADMINISTRADOR` según endpoint.
- `Authorization: Bearer <jwt>` opcional para este módulo (recomendado a nivel plataforma, no exigido por este controller).

## Estados permitidos
### `transferStatus`
- `SOLICITADA`
- `APROBADA`
- `RECHAZADA`
- `COMPLETADA`

### `targetStatus` (unidades)
- `DISPONIBLE`
- `TRANSFERIDO`
- `VENDIDO`
- `MERMA`
- `BAJA`

## Endpoints

### 1) `POST /logistics/warehouse/transfer/request`
**Propósito**
Registrar una solicitud de transferencia entre almacenes/sedes en estado inicial `SOLICITADA`.

**Autorización**
- `RoleGuard` + `@Roles('JEFE DE ALMACEN')`.
- Requiere `x-role: JEFE DE ALMACEN`.

**Body**
```json
{
  "originHeadquartersId": "1",
  "originWarehouseId": 10,
  "destinationHeadquartersId": "2",
  "destinationWarehouseId": 20,
  "observation": "Reposición de stock",
  "userId": 15,
  "items": [
    {
      "productId": 1001,
      "series": ["SER-001", "SER-002"]
    }
  ]
}
```

Validaciones principales:
- `originHeadquartersId`, `destinationHeadquartersId`: string no vacío.
- `originWarehouseId`, `destinationWarehouseId`, `userId`: entero.
- `items`: arreglo no vacío.
- Cada item: `productId` entero, `series` arreglo no vacío de strings.
- No permite series duplicadas entre items.
- Valida que almacén pertenezca a sede.
- Valida existencia de series y coherencia (`DISPONIBLE`, almacén origen y producto esperado).

**Response OK (`201`)**
Respuesta real: objeto de dominio `Transfer`.
```json
{
  "id": 77,
  "creatorUserId": 15,
  "originHeadquartersId": "1",
  "originWarehouseId": 10,
  "destinationHeadquartersId": "2",
  "destinationWarehouseId": 20,
  "items": [
    {
      "productId": 1001,
      "series": ["SER-001", "SER-002"],
      "quantity": 2
    }
  ],
  "totalQuantity": 2,
  "status": "SOLICITADA",
  "observation": "Reposición de stock",
  "requestDate": "2026-02-18T12:00:00.000Z"
}
```

**Errores esperados**
- `400 Bad Request`: validación DTO, series duplicadas, almacén no pertenece a sede, series inválidas/inexistentes.
- `401 Unauthorized`: falta `x-role`.
- `403 Forbidden`: rol no autorizado.
- `422 Unprocessable Entity`: si el esquema no permite relación de detalle (`details`).
- `500 Internal Server Error`: no controlado.

Ejemplo error `400`:
```json
{
  "statusCode": 400,
  "message": "La solicitud contiene series duplicadas en los items.",
  "error": "Bad Request"
}
```

### 2) `PATCH /logistics/warehouse/transfer/:id/approve`
**Propósito**
Aprobar transferencia `SOLICITADA`, validando series/stock y moviendo unidades a estado `TRANSFERIDO`.

**Autorización**
- `RoleGuard` + `@Roles('ADMINISTRADOR')`.
- Requiere `x-role: ADMINISTRADOR`.

**Params**
- `id` (path): entero (`ParseIntPipe`).

**Body**
```json
{
  "userId": 20
}
```

**Response OK (`200`)**
```json
{
  "id": 77,
  "creatorUserId": 20,
  "originHeadquartersId": "1",
  "originWarehouseId": 10,
  "destinationHeadquartersId": "2",
  "destinationWarehouseId": 20,
  "items": [
    {
      "productId": 1001,
      "series": ["SER-001", "SER-002"],
      "quantity": 2
    }
  ],
  "totalQuantity": 2,
  "status": "APROBADA",
  "observation": "Reposición de stock",
  "requestDate": "2026-02-18T12:00:00.000Z",
  "responseDate": "2026-02-18T12:05:00.000Z"
}
```

**Errores esperados**
- `400`: `id` inválido o body inválido.
- `401`: falta `x-role`.
- `403`: rol no autorizado.
- `404`: transferencia no encontrada.
- `409`: estado no válido para aprobar, stock insuficiente, conflicto de series.
- `500`: no controlado.

Ejemplo error `409`:
```json
{
  "statusCode": 409,
  "message": "Solo se puede aprobar una transferencia SOLICITADA.",
  "error": "Conflict"
}
```

### 3) `PATCH /logistics/warehouse/transfer/:id/reject`
**Propósito**
Rechazar transferencia en estado `SOLICITADA` o `APROBADA` y liberar series a `DISPONIBLE`.

**Autorización**
- `RoleGuard` + `@Roles('ADMINISTRADOR')`.
- Requiere `x-role: ADMINISTRADOR`.

**Params**
- `id` (path): entero.

**Body**
```json
{
  "userId": 20,
  "reason": "No procede por política interna"
}
```

**Response OK (`200`)**
```json
{
  "id": 77,
  "creatorUserId": 20,
  "originHeadquartersId": "1",
  "originWarehouseId": 10,
  "destinationHeadquartersId": "2",
  "destinationWarehouseId": 20,
  "items": [
    {
      "productId": 1001,
      "series": ["SER-001", "SER-002"],
      "quantity": 2
    }
  ],
  "totalQuantity": 2,
  "status": "RECHAZADA",
  "observation": "Reposición de stock | Motivo Rechazo: No procede por política interna",
  "requestDate": "2026-02-18T12:00:00.000Z",
  "responseDate": "2026-02-18T12:07:00.000Z"
}
```

**Errores esperados**
- `400`: validaciones de params/body.
- `401`: falta `x-role`.
- `403`: rol no autorizado.
- `404`: transferencia no encontrada.
- `409`: estado no permitido para rechazo.
- `500`: no controlado.

### 4) `PATCH /logistics/warehouse/transfer/:id/confirm-receipt`
**Propósito**
Confirmar recepción de transferencia `APROBADA`, mover series al almacén destino y dejar unidades `DISPONIBLE` en destino; cambia estado a `COMPLETADA`.

**Autorización**
- `RoleGuard` + `@Roles('ADMINISTRADOR')`.
- Requiere `x-role: ADMINISTRADOR`.

**Params**
- `id` (path): entero.

**Body**
```json
{
  "userId": 25
}
```

**Response OK (`200`)**
```json
{
  "id": 77,
  "creatorUserId": 25,
  "originHeadquartersId": "1",
  "originWarehouseId": 10,
  "destinationHeadquartersId": "2",
  "destinationWarehouseId": 20,
  "items": [
    {
      "productId": 1001,
      "series": ["SER-001", "SER-002"],
      "quantity": 2
    }
  ],
  "totalQuantity": 2,
  "status": "COMPLETADA",
  "observation": "Reposición de stock",
  "requestDate": "2026-02-18T12:00:00.000Z",
  "responseDate": "2026-02-18T12:05:00.000Z",
  "completionDate": "2026-02-18T12:20:00.000Z"
}
```

**Errores esperados**
- `400`: id/body inválidos.
- `401`: falta `x-role`.
- `403`: rol no autorizado.
- `404`: transferencia no encontrada.
- `409`: transferencia no está `APROBADA`, faltan series en detalle o series no están `TRANSFERIDO`.
- `500`: no controlado.

Ejemplo `409`:
```json
{
  "statusCode": 409,
  "message": "Solo se puede confirmar recepción de transferencias APROBADAS.",
  "error": "Conflict"
}
```

### 5) `GET /logistics/warehouse/transfer/headquarters/:hqId`
**Propósito**
Listar transferencias en las que participa la sede (origen o destino).

**Autorización**
- Sin `@Roles` en handler.
- No exige `x-role` por lógica actual del `RoleGuard`.

**Params**
- `hqId` (path): string.

**Response OK (`200`)**
Respuesta real: arreglo de `Transfer` de dominio.
```json
[
  {
    "id": 77,
    "creatorUserId": 25,
    "originHeadquartersId": "1",
    "originWarehouseId": 10,
    "destinationHeadquartersId": "2",
    "destinationWarehouseId": 20,
    "items": [
      {
        "productId": 1001,
        "series": ["SER-001", "SER-002"],
        "quantity": 2
      }
    ],
    "totalQuantity": 2,
    "status": "COMPLETADA",
    "observation": "Reposición de stock",
    "requestDate": "2026-02-18T12:00:00.000Z"
  }
]
```

**Errores esperados**
- `200` con `[]` si no hay resultados.
- `500` no controlado.

### 6) `GET /logistics/warehouse/transfer`
**Propósito**
Listar todas las transferencias con shape enriquecido para vista de listado.

**Autorización**
- Sin `@Roles` en handler.

**Query**
- No aplica.

**Response OK (`200`)**
Respuesta real: arreglo con shape de resumen (no es el objeto `Transfer` crudo).
```json
[
  {
    "id": 77,
    "origin": {
      "id_sede": "1",
      "nomSede": "Sede Central"
    },
    "destination": {
      "id_sede": "2",
      "nomSede": "Sucursal Norte"
    },
    "totalQuantity": 2,
    "status": "COMPLETADA",
    "observation": "Reposición de stock",
    "nomProducto": "TV 55",
    "creatorUser": {
      "idUsuario": 25,
      "usuNom": "Juan",
      "apePat": "Perez"
    }
  }
]
```

Notas:
- Si no resuelve nombres de sede/producto/usuario, usa fallback (`"Sede <id>"`, `creatorUser: null`, `nomProducto: ""`).

**Errores esperados**
- `500` no controlado.

### 7) `GET /logistics/warehouse/transfer/:id`
**Propósito**
Obtener detalle completo de transferencia para vista de detalle.

**Autorización**
- Sin `@Roles` en handler.

**Params**
- `id` (path): entero.

**Response OK (`200`)**
Respuesta real: objeto enriquecido de detalle.
```json
{
  "id": 77,
  "origin": {
    "id_sede": "1",
    "nomSede": "Sede Central"
  },
  "originWarehouse": {
    "id_almacen": 10,
    "nomAlm": "Almacén Principal"
  },
  "destination": {
    "id_sede": "2",
    "nomSede": "Sucursal Norte"
  },
  "destinationWarehouse": {
    "id_almacen": 20,
    "nomAlm": "Almacén Norte"
  },
  "totalQuantity": 2,
  "status": "COMPLETADA",
  "observation": "Reposición de stock",
  "requestDate": "2026-02-18T12:00:00.000Z",
  "items": [
    {
      "series": ["SER-001", "SER-002"],
      "quantity": 2,
      "producto": {
        "id_producto": 1001,
        "categoria": {
          "id_categoria": 4,
          "nombre": "Electro"
        },
        "codigo": "P-1001",
        "nomProducto": "TV 55",
        "descripcion": "Televisor 55 pulgadas"
      }
    }
  ],
  "creatorUser": {
    "idUsuario": 25,
    "usuNom": "Juan",
    "apePat": "Perez"
  }
}
```

**Errores esperados**
- `400`: `id` inválido.
- `404`: transferencia no encontrada.
- `500`: no controlado.

## Flujo funcional (CU-04)
1. Solicitar transferencia (`request`).
- Estado inicial: `SOLICITADA`.
- Valida coherencia sede/almacén, series no duplicadas, series existentes y `DISPONIBLE` en almacén origen.

2. Aprobar transferencia (`approve`).
- Precondición: estado `SOLICITADA`.
- Valida stock por producto y consistencia de series.
- Cambia estado a `APROBADA`.
- Marca series como `TRANSFERIDO`.

3. Rechazar transferencia (`reject`).
- Permitido desde `SOLICITADA` o `APROBADA`.
- Cambia estado a `RECHAZADA`.
- Agrega motivo a observación.
- Libera series a `DISPONIBLE`.

4. Confirmar recepción (`confirm-receipt`).
- Precondición: estado `APROBADA`.
- Exige detalle de series y que estén en `TRANSFERIDO` en almacén origen.
- Mueve unidades al almacén destino y las deja `DISPONIBLE`.
- Registra movimiento de inventario.
- Cambia estado a `COMPLETADA`.

## Endpoints adicionales relacionados
Además de `warehouse/transfer`, existe un endpoint HTTP en módulo de unidades con impacto en transferencias:

1. `PATCH /logistics/units/status/bulk/:id`
- Controller: `apps/logistics/src/core/catalog/unit/infrastructure/adapters/in/unit-rest.controller.ts`
- Permite actualizar estado masivo de series (`targetStatus`) y opcionalmente actualizar estado de transferencia (`transferStatus`) para `transferId = :id`.
- Body relevante:
```json
{
  "series": ["SER-001", "SER-002"],
  "targetStatus": "TRANSFERIDO",
  "transferStatus": "APROBADA"
}
```

2. `PATCH /logistics/units/status/bulk`
- Misma operación masiva de estados de unidades, sin `transferId` por path.

## Notas técnicas
1. Swagger
- El repo tiene uso parcial de `@nestjs/swagger` en otros módulos, pero **en logistics transfer no está configurado Swagger en `main.ts`**. Por eso la fuente principal de documentación es este Markdown.

2. Tipado DTO de salida agregado
- Se añadieron DTOs `out` de transferencias para reflejar shapes reales de respuesta y eliminar ambigüedad de `any` en consultas:
  - `apps/logistics/src/core/warehouse/transfer/application/dto/out/transfer-response.dto.ts`
  - `apps/logistics/src/core/warehouse/transfer/application/dto/out/transfer-list-response.dto.ts`
  - `apps/logistics/src/core/warehouse/transfer/application/dto/out/transfer-by-id-response.dto.ts`
  - `apps/logistics/src/core/warehouse/transfer/application/dto/out/index.ts`
