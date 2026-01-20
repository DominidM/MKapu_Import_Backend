/* auth/src/core/application/dto/out/AccountUserResponseDto.ts */
export interface AccountUserResponseDto {
  contrasenia(password: string, contrasenia: any): unknown;
  isActive(): unknown;
  id: string;
  nombreUsuario: string;
  email: string;
  estado: boolean;
  rolNombre: string;
  nombreCompletoPersona: string;
}
