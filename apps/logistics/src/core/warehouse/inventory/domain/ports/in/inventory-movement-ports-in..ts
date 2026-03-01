import { CreateInventoryMovementDto } from '../../../application/dto/in/create-inventory-movement.dto';

export type MovementRequest = Omit<
  CreateInventoryMovementDto,
  'items' | 'originType'
> & {
  originType?: 'TRANSFERENCIA' | 'COMPRA' | 'VENTA' | 'AJUSTE';
  items: Omit<CreateInventoryMovementDto['items'][0], 'type'>[];
};
export interface InventoryAdjustmentItem {
  productId: number;
  warehouseId: number;
  sedeId: number;
  difference: number;
}

export interface ApplyAdjustmentsDto {
  refId: number;
  refTable: string;
  adjustments: InventoryAdjustmentItem[];
}
export interface IInventoryMovementCommandPort {
  getStockLevel(productId: number, warehouseId: number): Promise<number>;
  executeMovement(dto: CreateInventoryMovementDto): Promise<void>;
  registerIncome(dto: MovementRequest): Promise<void>;
  registerExit(dto: MovementRequest): Promise<void>;
  applyInventoryAdjustments(dto: ApplyAdjustmentsDto): Promise<void>;
  getStockLevel(productId: number, warehouseId: number): Promise<number>;
}
