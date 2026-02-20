import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  codigo: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  departamento?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  provincia?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  direccion?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? null)
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}