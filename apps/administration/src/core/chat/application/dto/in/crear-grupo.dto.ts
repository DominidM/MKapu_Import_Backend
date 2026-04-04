
import { IsArray, IsInt, IsString, MinLength, ArrayMinSize } from 'class-validator';

export class CrearGrupoDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsInt({ each: true })
  id_cuentas: number[];

  @IsInt()
  id_sede: number;
}