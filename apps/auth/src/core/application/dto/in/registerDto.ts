/* auth/src/core/application/dto/in/registerDto.ts */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'juanperez', description: 'Nombre de usuario único' })
  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  contrasenia: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Correo electrónico' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 1, description: 'ID del rol asignado' })
  @IsNumber()
  id_rol: number;

  @ApiProperty({ example: 'Administrador', description: 'Nombre del rol' })
  @IsString()
  rolNombre: string;

  @ApiProperty({ example: 1, description: 'ID de la sede (opcional)', required: false })
  @IsNumber()
  @IsOptional()
  id_sede: number;

  @ApiProperty({ example: 10, description: 'ID de referencia de usuario (opcional)', required: false })
  @IsNumber()
  @IsOptional()
  id_usuario: number;
}
