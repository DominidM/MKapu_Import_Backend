import { IsOptional, IsInt, IsString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListProductStockFilterDto {
  // ✅ Simple: solo marca como string, NestJS lo convierte automáticamente
  @IsString()
  id_sede: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_categoria?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activo?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;
}