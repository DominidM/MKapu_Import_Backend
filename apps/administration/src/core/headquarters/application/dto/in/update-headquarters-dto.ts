//application/dto/in/update-headquarters-dto.ts
/* ============================================
   administration/src/core/headquarters/application/dto/in/update-headquarters-dto.ts
   ============================================ */

export class UpdateHeadquartersDto {
   id_sede: number;
   nombre?: string;
   ciudad?: string;
   departamento?: string;
   direccion?: string;
   telefono?: string;
   activo?: boolean;
}