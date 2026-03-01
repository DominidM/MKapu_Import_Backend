import { IsString, IsNumber } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  nombre: string;

  @IsNumber()
  porcentaje: number;
}