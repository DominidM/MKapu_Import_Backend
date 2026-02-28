import { IsInt, IsNumber } from 'class-validator';

export class OpenCashboxDto {
  @IsInt()
  id_sede_ref: number;

  @IsNumber()
  monto_inicial: number;
}