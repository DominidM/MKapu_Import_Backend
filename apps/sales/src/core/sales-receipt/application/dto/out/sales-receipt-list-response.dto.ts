

/* ============================================
   sales/src/core/sales-receipt/application/dto/out/sales-receipt-list-response.dto.ts
   ============================================ */

import { SalesReceiptResponseDto } from './sales-receipt-response.dto';

export interface SalesReceiptListResponse {
  receipts: SalesReceiptResponseDto[];
  total: number;
}