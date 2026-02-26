import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ConteoDetalleInputDto } from './finalizar-conteo.dto';
import { ConteoEstado } from '../../../infrastructure/entity/inventory-count-orm.entity';
export class IniciarConteoDto {
  @IsString()
  @IsNotEmpty()
  idSede: string;

  @IsString()
  @IsNotEmpty()
  nomSede: string;

  @IsInt()
  @IsNotEmpty()
  idUsuario: number;
  @IsInt()
  @IsOptional()
  idCategoria?: number;

  @IsString()
  @IsOptional()
  nomCategoria?: string;
}

export class ActualizarDetalleConteoDto {
  @IsNumber()
  @Min(0)
  stockConteo: number;

  @IsString()
  @IsOptional()
  observacion?: string;
}
export class FinalizarConteoDto {
  @IsEnum(['AJUSTADO', 'ANULADO'])
  @IsNotEmpty()
  estado: ConteoEstado;

  @IsInt()
  @IsOptional()
  total_items?: number;

  @IsNumber()
  @IsOptional()
  total_diferencias?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConteoDetalleInputDto)
  @IsOptional()
  data?: ConteoDetalleInputDto[];
}
