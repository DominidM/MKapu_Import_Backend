import { IsString, IsNumber, IsOptional, IsBoolean, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class PromotionRuleDto {
  @IsString()
  tipoCondicion: string;

  @IsString()
  valorCondicion: string;
}

class DiscountAppliedDto {
  @IsNumber()
  monto: number;

  @IsOptional()
  @IsNumber()
  idDescuento?: number;
}

export class CreatePromotionDto {
  @IsString()
  concepto: string;

  @IsString()
  tipo: string;

  @IsNumber()
  valor: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  reglas?: PromotionRuleDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscountAppliedDto)
  descuentosAplicados?: DiscountAppliedDto[];
}