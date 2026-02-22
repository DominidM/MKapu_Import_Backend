/* auth/src/core/application/dto/in/loginDto.ts */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario123', description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'passwordSeguro', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
