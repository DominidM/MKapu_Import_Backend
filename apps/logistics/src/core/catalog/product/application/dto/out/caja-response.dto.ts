// application/dto/out/caja-response.dto.ts

export class CajaResponseDto {
  id_caja:           number;
  id_producto:       number;
  cantidad_unidades: number;
  cod_caja:          string;
  pre_caja:          number;
  pre_mayorista:     number | null;
}