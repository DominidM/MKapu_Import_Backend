import { IsInt, IsPositive } from 'class-validator';

export class MarcarLeidosDto {
  @IsInt()
  @IsPositive()
  id_conversacion: number;

  @IsInt()
  @IsPositive()
  id_cuenta: number;
}