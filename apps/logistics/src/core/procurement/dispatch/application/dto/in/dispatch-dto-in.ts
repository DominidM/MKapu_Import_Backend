// apps/logistics/src/core/procurement/dispatch/application/dto/in/create-dispatch-dto.ts

import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsISO8601,
  IsOptional,
} from 'class-validator';

export class CreateDispatchDto {
  @IsNotEmpty()
  @IsNumber()
  id_venta_ref: number;

  @IsNotEmpty()
  @IsNumber()
  id_usuario_ref: number;

  @IsNotEmpty()
  @IsNumber()
  id_almacen_origen: number;

  @IsNotEmpty()
  @IsISO8601()
  fecha_programada: string;

  @IsNotEmpty()
  @IsString()
  direccion_entrega: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}
