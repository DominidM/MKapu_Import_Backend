import { IsInt, IsPositive } from 'class-validator';

export class CrearConversacionPrivadaDto {
  @IsInt()
  @IsPositive()
  id_cuenta_1: number;

  @IsInt()
  @IsPositive()
  id_cuenta_2: number;

  @IsInt()
  @IsPositive()
  id_sede: number;
}