// application/dto/in/create-caja.dto.ts

import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCajaDto {
  @IsNumber()
  @Min(1)
  id_producto: number;

  @IsNumber()
  @Min(1)
  cantidad_unidades: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toUpperCase())
  cod_caja: string;

  @IsNumber()
  @Min(0.01)
  pre_caja: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  pre_mayorista?: number | null;
}