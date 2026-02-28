export class SalesReceiptDetailProductoDto {
  id_prod_ref: string;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  igv: number;
  total: number;
}

export class SalesReceiptHistorialItemDto {
  id_comprobante: number;
  numero_completo: string;
  fec_emision: Date;
  total: number;
  estado: string;
  metodo_pago: string;
  responsable: string;
}

export class SalesReceiptDetalleCompletoDto {
  id_comprobante: number;
  numero_completo: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: Date;
  estado: string;
  subtotal: number;
  igv: number;
  total: number;
  metodo_pago: string;

  cliente: {
    id_cliente: string;
    nombre: string;
    documento: string;
    tipo_documento: string;
    direccion: string;
    email: string;
    telefono: string;
    total_gastado_cliente: number;
    cantidad_compras: number;
  };

  productos: SalesReceiptDetailProductoDto[];

  responsable: {
    id: string;
    nombre: string;
    sede: number;
    nombreSede: string;
  };

  historial_cliente: SalesReceiptHistorialItemDto[];

  historial_pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
