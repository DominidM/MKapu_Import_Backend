
// register-permission.dto.ts
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsInt, IsPositive } from 'class-validator';

export class RegisterPermissionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nombre:        string;

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