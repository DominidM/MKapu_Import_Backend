import { CreateInventoryMovementDto } from '../../../application/dto/in/create-inventory-movement.dto';

// CORRECCIÓN: Omitimos 'originType' del DTO base y lo re-definimos como opcional
export type MovementRequest = Omit<CreateInventoryMovementDto, 'items' | 'originType'> & {
  originType?: 'TRANSFERENCIA' | 'COMPRA' | 'VENTA' | 'AJUSTE'; 
  items: Omit<CreateInventoryMovementDto['items'][0], 'type'>[];
};

export interface IInventoryMovementCommandPort {
  executeMovement(dto: CreateInventoryMovementDto): Promise<void>;
  registerIncome(dto: MovementRequest): Promise<void>;
  registerExit(dto: MovementRequest): Promise<void>;
}