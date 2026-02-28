import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}