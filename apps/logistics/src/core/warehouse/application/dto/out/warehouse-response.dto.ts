export class WarehouseResponseDto {
  id!: number;
  codigo!: string;
  nombre?: string;
  departamento?: string;
  provincia?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  activo!: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}