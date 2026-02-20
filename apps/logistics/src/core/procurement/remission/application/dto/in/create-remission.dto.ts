import {
  IsString,
  IsNumber,
  ValidateNested,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  RemissionType,
  TransportMode,
} from '../../../domain/entity/remission-domain-entity';

class TransportDataDto {
  // Para Transporte PRIVADO
  @IsOptional() @IsString() nombre_completo?: string;
  @IsOptional() @IsString() tipo_documento?: string;
  @IsOptional() @IsString() numero_documento?: string;
  @IsOptional() @IsString() licencia?: string;
  @IsOptional() @IsString() placa?: string;

  // Para Transporte PUBLICO
  @IsOptional() @IsString() ruc?: string;
  @IsOptional() @IsString() razon_social?: string;
}

class TransferDataDto {
  @IsString() ubigeo_origen: string;
  @IsString() direccion_origen: string;
  @IsString() ubigeo_destino: string;
  @IsString() direccion_destino: string;
}

class RemissionItemDto {
  @IsNumber() id_producto: number;
  @IsString() cod_prod: string;
  @IsNumber() cantidad: number;
  @IsNumber() peso_total: number;
}
export class CreateRemissionDto {
  @IsNumber() id_comprobante_ref: number;
  @IsNumber() id_sede_origen: string;
  @IsNumber() id_usuario: number;

  @IsEnum(RemissionType)
  tipo_guia: RemissionType;

  @IsEnum(TransportMode)
  modalidad: TransportMode;

  @IsDateString()
  fecha_inicio_traslado: string;

  @IsString()
  motivo_traslado: string;

  @IsNumber()
  peso_bruto_total: number;

  // Objetos anidados
  @ValidateNested()
  @Type(() => TransferDataDto)
  datos_traslado: TransferDataDto;

  @ValidateNested()
  @Type(() => TransportDataDto)
  datos_transporte: TransportDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemissionItemDto)
  items: RemissionItemDto[];
}
