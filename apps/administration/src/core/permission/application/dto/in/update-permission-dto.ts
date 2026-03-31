// update-permission.dto.ts
import { IsOptional, IsString, MaxLength, IsInt, IsPositive } from 'class-validator';

export class UpdatePermissionDto {
  id_permiso:    number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nombre?:       string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  descripcion?:  string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  modulo?:       string;      

  @IsOptional()
  @IsInt()
  @IsPositive()
  depende_de?:   number | null; 
}