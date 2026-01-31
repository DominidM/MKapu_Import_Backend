/* sales/src/core/sales-receipt/application/dto/in/register-sales-receipt.dto.ts */

export interface SalesReceiptItemDto {
  productId: string;
  quantity: number; 
  unitPrice: number;
  description: string;
  total: number;
  igv?: number;
}

export interface RegisterSalesReceiptDto {
  customerId: string;
  saleTypeId: number;
  receiptTypeId: number;
  serie: string;
  dueDate: Date;
  operationType: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  currencyCode: string;
  responsibleId: string;
  branchId: number;
  items: SalesReceiptItemDto[];
  
  // ✅ Nuevo campo para el flujo de pago
  paymentMethodId: number; 
}