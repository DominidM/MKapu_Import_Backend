export type TipoPrecio = 'UNITARIO' | 'CAJA' | 'MAYORISTA';

export interface SalesReceiptItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  description: string;
  total: number;
  igv?: number;
  codigo?: string;
  categoriaId?: number;
  tipoPrecio?: TipoPrecio;
  id_detalle_remate?: number | null;
}

export interface RegisterSalesReceiptDto {
  customerId: string;
  customerName?: string;
  saleTypeId: number;
  receiptTypeId: number;
  serie: string;
  dueDate: Date | string;
  operationType?: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  currencyCode?: string;
  responsibleId: string;
  branchId: number;
  warehouseId: number;
  paymentMethodId: number;
  operationNumber?: string | null;
  esCreditoPendiente?: boolean;
  promotionId?: number | null;
  descuento?: number;
  items: SalesReceiptItemDto[];
}