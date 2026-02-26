import { RemissionResponseDto } from './remission-response.dto';
export class RemissionItemResponseDto {
  id_producto: number;
  cod_prod: string;
  cantidad: number;
  peso_total: number;
  peso_unitario: number;
}

export class RemissionDetailResponseDto extends RemissionResponseDto {
  items: RemissionItemResponseDto[];
  datos_transporte_completos: any;
  direccion_partida: string;
  direccion_llegada: string;
}
