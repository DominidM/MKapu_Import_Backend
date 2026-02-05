/* sales/src/core/warranty/application/dto/in/register-warranty.dto.ts */
import {
  IsInt,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Optional } from '@nestjs/common';

export class RegisterWarrantyDetailDto {

  @IsInt() // Agregamos esto
  id_prod_ref: number;

  @IsInt() // Agregamos esto
  cantidad: number;
  
  @IsString()
  tipo_solicitud: string;

  @IsString()
  descripcion: string;
}

export class RegisterWarrantyDto {
  @IsInt()
  id_comprobante: number;

  @IsString()
  @IsInt() // Cambiado de IsString a IsInt para coincidir con la BD (int)
  id_usuario_recepcion: number;

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
  @IsOptional()
  num_garantia?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterWarrantyDetailDto)
  detalles: RegisterWarrantyDetailDto[];
}
