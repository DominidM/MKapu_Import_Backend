import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdatePromotionRuleDto {
  @IsOptional()
  @IsNumber()
  idRegla?: number;

  @IsString()
  tipoCondicion: string;

  @IsString()
  valorCondicion: string;
}

class UpdateDiscountAppliedDto {
  @IsOptional()
  @IsNumber()
  idDescuento?: number;

  @IsNumber()
  monto: number;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  concepto?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePromotionRuleDto)
  reglas?: UpdatePromotionRuleDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateDiscountAppliedDto)
  descuentosAplicados?: UpdateDiscountAppliedDto[];
}
