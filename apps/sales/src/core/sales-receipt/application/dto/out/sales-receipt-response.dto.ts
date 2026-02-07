export class SalesReceiptResponseDto {
  idComprobante: number;
  idCliente: string;
  numeroCompleto: string;
  serie: string;
  numero: number;
  fecEmision: Date;
  fecVenc?: Date; // ✅ Agregado
  tipoOperacion: string; // ✅ Agregado
  subtotal: number; // ✅ Agregado
  igv: number; // ✅ Agregado
  isc: number; // ✅ Agregado
  total: number;
  estado: string;
  codMoneda: string; // ✅ Agregado
  idTipoComprobante: number; // ✅ Agregado
  idTipoVenta: number; // ✅ Agregado
  idSedeRef: number; // ✅ Agregado
  idResponsableRef: string; // ✅ Agregado
  items: SalesReceiptItemResponseDto[];
}

export class SalesReceiptItemResponseDto {
  productId: string;
  productName: string; // ✅ Debe llenarse desde descripcion
  codigoProducto?: string; // ✅ Agregado (cod_prod)
  quantity: number;
  unitPrice: number; // pre_uni
  unitValue: number; // ✅ Agregado (valor_uni)
  igv: number;
  tipoAfectacionIgv: number; // ✅ Agregado
  total: number;
}