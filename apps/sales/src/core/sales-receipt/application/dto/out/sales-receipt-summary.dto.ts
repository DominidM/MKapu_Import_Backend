/* application/dto/out/sales-receipt-summary.dto.ts */

export class SalesReceiptSummaryItemDto {
  idComprobante: number;
  numeroCompleto: string;
  serie: string;
  numero: number;
  tipoComprobante: string;
  fecEmision: Date;
  clienteNombre: string;
  clienteDocumento: string;
  idResponsable: string;
  responsableNombre: string;   // ← NUEVO
  idSede: number;
  sedeNombre: string;          // ← NUEVO
  metodoPago: string;
  total: number;
  estado: string;
}

export class SalesReceiptSummaryListDto {
  receipts: SalesReceiptSummaryItemDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
