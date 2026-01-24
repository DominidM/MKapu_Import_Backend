//applicaction/dto/in/list-headquarters-filter-dto.ts
/* ============================================
   administration/src/core/headquarters/application/dto/in/list-headquarters-filter-dto.ts
   ============================================ */

export interface ListHeadquartersFilterDto {
   search?: string; // Filtro por nombre o codigo
   activo?: boolean;
}