export interface StockPortsIn {
  applyMovement(
    productId: number,
    warehouseId: number,
    headquartersId: string,
    delta: number,
    reason: 'VENTA' | 'COMPRA' | 'TRANSFERENCIA' | 'AJUSTE',
    referenceId?: number,
  ): Promise<void>;
}
