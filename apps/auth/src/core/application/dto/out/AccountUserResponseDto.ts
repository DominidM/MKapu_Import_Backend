import { ApiProperty } from '@nestjs/swagger';

export class AccountUserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'admin_user' })
  nombreUsuario: string;

  @ApiProperty({ example: 'admin@email.com' })
  email: string;

  @ApiProperty({ example: true })
  estado: boolean;

  @ApiProperty({ example: 'Administrador' })
  rolNombre: string;
}