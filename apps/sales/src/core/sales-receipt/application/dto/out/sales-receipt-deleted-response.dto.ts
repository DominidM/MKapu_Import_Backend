
/* ============================================
   sales/src/core/sales-receipt/application/dto/out/sales-receipt-deleted-response.dto.ts
   ============================================ */

export interface SalesReceiptDeletedResponseDto {
  receiptId: number;
  message: string;
  deletedAt: Date;
}