import { IsString, IsDateString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDetailDto {
  @IsNumber()
  id_prod_ref: number;

  @IsString()
  cod_prod: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio: number;

  @IsOptional()
  @IsNumber()
  id_almacen?: number; 
}

export class CreateQuoteDto {
  @IsString()
  documento_cliente: string;

  @IsDateString()
  fec_venc: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  igv: number;

  @IsNumber()
  total: number;

  @IsNumber()
  id_sede: number; 

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteDetailDto)
  detalles: CreateQuoteDetailDto[];
}