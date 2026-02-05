/* apps/logistics/src/core/warehouse/inventory/application/dto/in/create-inventory-movement.dto.ts */
export class CreateInventoryMovementDto {
  originType: 'TRANSFERENCIA' | 'COMPRA' | 'VENTA' | 'AJUSTE';
  refId: number;
  refTable: string;
  observation?: string;
  items: {
    productId: number;
    warehouseId: number;
    quantity: number;
    type: 'INGRESO' | 'SALIDA';
  }[];
}