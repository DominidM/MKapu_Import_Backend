export interface DeductStockParams {
  remissionId: string;
  warehouseId: number;
  items: ReadonlyArray<{ id_producto: number; cantidad: number ,sedeId: number}>;
  serie_numero: string;
  refId: number;
}

export interface InventoryFacadePort {
  deductStockForRemission(params: DeductStockParams): Promise<void>;
}
