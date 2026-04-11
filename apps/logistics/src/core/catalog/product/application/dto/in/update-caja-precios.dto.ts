// application/dto/in/update-caja-precios.dto.ts

import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCajaPreciosDto {
  @IsNumber()
  @Min(0.01)
  pre_caja: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  pre_mayorista?: number | null;
}