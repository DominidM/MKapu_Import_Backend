
/* ============================================
   sales/src/core/sales-receipt/application/dto/out/sales-receipt-response.dto.ts
   ============================================ */

export interface SalesReceiptResponseDto {
  receiptId: number;
  customerId: string;
  customerName: string;
  saleTypeId: number;
  saleTypeDescription: string;
  receiptTypeId: number;
  receiptTypeDescription: string;
  documentNumber: string;      // "B001-00000123"
  serie: string;
  numero: number;
  issueDate: Date;
  dueDate: Date;
  operationType: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  currencyCode: string;
  currencyDescription: string;
  status: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
  responsibleId: string;
  branchId: number;
  isExpired: boolean;
  canBeAnnulled: boolean;
}