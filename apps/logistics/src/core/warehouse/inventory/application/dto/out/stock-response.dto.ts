/* apps/logistics/src/core/warehouse/inventory/application/dto/out/stock-response.dto.ts */
export class StockResponseDto {
  productId: number;
  warehouseId: number;
  quantity: number;
  headquartersId: string;
  status: string;
}