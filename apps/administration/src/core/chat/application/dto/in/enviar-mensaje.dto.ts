import { IsInt, IsPositive, IsString, MinLength, MaxLength } from 'class-validator';

export class EnviarMensajeDto {
  @IsInt()
  @IsPositive()
  id_conversacion: number;

  @IsInt()
  @IsPositive()
  id_cuenta: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  contenido: string;
}