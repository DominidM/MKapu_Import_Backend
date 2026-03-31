/* ============================================
   administration/src/core/permission/application/dto/out/permission-response-dto.ts
   ============================================ */

export interface PermissionResponseDto {
  id_permiso:  number;
  nombre:      string;
  descripcion?: string;
  activo:      boolean;
  modulo:      string;        
  depende_de:  number | null; 
}