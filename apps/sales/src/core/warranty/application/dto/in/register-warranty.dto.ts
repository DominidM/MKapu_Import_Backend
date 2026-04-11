import { IsInt, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// register-warranty.dto.ts
export class RegisterWarrantyDto {
  @IsInt()
  id_comprobante: number;

  @IsOptional()
  @IsInt()
  id_usuario_recepcion?: number;

  @IsOptional()
  @IsString()
  id_usuario_ref?: string;

  @IsInt()
  id_sede_ref: number;

  @IsString()
  cod_prod: string;

  @IsString()
  prod_nombre: string;

  @IsString()
  motivo: string;              

  @IsOptional()
  @IsString()
  observaciones?: string;    

  @IsOptional()
  @IsString()
  num_garantia?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterWarrantyDto)
  detalles?: RegisterWarrantyDto[];
}