/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { IsNumber, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateDispatchDto } from './dispatch-dto-in';

export class UpdateDispatchDto extends PartialType(CreateDispatchDto) {
  @IsOptional()
  @IsNumber()
  id_despacho: number;
}
