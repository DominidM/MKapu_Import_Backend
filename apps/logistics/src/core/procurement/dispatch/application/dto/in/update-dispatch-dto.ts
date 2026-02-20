/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsISO8601,
} from 'class-validator';
import { DispatchStatus } from '../../../domain/entity/dispatch-domain-entity';
import { PartialType } from '@nestjs/swagger';
import { CreateDispatchDto } from './dispatch-dto-in';

export class UpdateDispatchDto extends PartialType(CreateDispatchDto) {
  @IsNotEmpty()
  @IsNumber()
  id_despacho: number;

  @IsOptional()
  @IsEnum(DispatchStatus)
  estado?: DispatchStatus;

  @IsOptional()
  @IsISO8601()
  fecha_salida?: string;

  @IsOptional()
  @IsISO8601()
  fecha_entrega?: string;
}
