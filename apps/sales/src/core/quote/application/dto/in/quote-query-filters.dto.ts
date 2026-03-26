// quote-query-filters.dto.ts
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class QuoteQueryFiltersDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())  // ← esto es clave
  search?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_sede?: number;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}