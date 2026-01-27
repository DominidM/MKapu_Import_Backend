export interface InventoryMovementItemParams {
  productId: number;
  warehouseId: number;
  quantity: number;
  type: 'INGRESO' | 'SALIDA';
}

export interface SaveMovementParams {
  originType: string; // O el Enum OriginType
  refId: number;
  refTable: string;
  observation?: string;
  items: InventoryMovementItemParams[];
}

export interface InventoryMovementPortsOut {
  save(params: SaveMovementParams): Promise<void>;
}
