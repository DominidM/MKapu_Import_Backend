import { IsOptional, IsDateString, IsNumber } from 'class-validator';

export class UpdateWarrantyDto {
  @IsOptional()
  @IsDateString()
  fec_recepcion?: string; // Cambiado a string para validación de entrada

  @IsOptional()
  fec_recepcion?: Date;

  @IsNumber()
  @IsOptional()
  id_sede_ref?: number;
}
