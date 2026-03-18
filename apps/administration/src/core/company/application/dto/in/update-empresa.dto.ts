import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class UpdateEmpresaDto {
  @IsString()
  @MaxLength(100)
  nombreComercial: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  razonSocial?: string;

  @IsString()
  @MaxLength(11)
  ruc: string;

  @IsString()
  @IsOptional()
  sitioWeb?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  ciudad?: string;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  logoPublicId?: string;
}