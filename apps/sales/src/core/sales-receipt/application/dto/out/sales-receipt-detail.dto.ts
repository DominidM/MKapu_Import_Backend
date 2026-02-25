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
  // Comprobante
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

  // Cliente
  cliente: {
    id_cliente: string;
    nombre: string;
    documento: string;
    tipo_documento: string;
    direccion: string;
    email: string;
    telefono: string;
    total_gastado_cliente: number; // ← NUEVO: suma histórica total del cliente
    cantidad_compras: number; // ← NUEVO: cuántas veces ha comprado
  };

  // Productos
  productos: SalesReceiptDetailProductoDto[];

  // Responsable
  responsable: {
    id: string;
    nombre: string; // ← NUEVO
    sede: number;
    nombreSede: string; // ← NUEVO
  };
  // Historial del mismo cliente
  historial_cliente: SalesReceiptHistorialItemDto[];
}
