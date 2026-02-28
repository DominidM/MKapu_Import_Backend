export class QuoteDetailResponseDto {
  id_detalle: number;
  id_prod_ref: number;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  importe: number;
}

export interface QuoteResponseDto {
  id_cotizacion: number;
  id_cliente: string;
  cliente: {
    nombre_cliente: string;
    apellidos_cliente: string;
    direccion: string;
    razon_social: string;
    email: string;
    telefono: string;
    id_tipo_documento: string;
    valor_doc: string;
  };
  id_sede: number;
  sede: {
    nombre_sede: string;
    codigo: string;
    ciudad: string;
    departamento: string;
    direccion: string;
    telefono: string;
  };
  fec_emision: string;
  fec_venc: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: string;
  activo: boolean;
  detalles: QuoteDetailResponseDto[];
}

//  Para la tabla (ligero)
export interface QuoteListItemDto {
  id_cotizacion: number;
  codigo: string;
  cliente_nombre: string;
  fec_emision: string;
  fec_venc: string;
  id_sede: number;
  sede_nombre: string;
  estado: string;
  total: number;
  activo: boolean;
}

// Para paginación
export interface QuotePagedResponseDto {
  data: QuoteListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}