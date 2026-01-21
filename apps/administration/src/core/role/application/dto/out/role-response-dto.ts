
/* ============================================
   administration/src/core/role/application/dto/out/role-response-dto.ts
   ============================================ */

export interface RoleResponseDto {
  id_rol: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}
