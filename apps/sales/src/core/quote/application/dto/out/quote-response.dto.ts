export class QuoteDetailResponseDto {
  id_detalle: number;
  id_prod_ref: number;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  importe: number;
}

export class QuoteResponseDto {
  id_cotizacion: number;
  id_cliente: string;
  fec_emision: Date;
  fec_venc: Date;
  total: number;
  estado: string;
  activo: boolean;
  detalles: QuoteDetailResponseDto[];
}