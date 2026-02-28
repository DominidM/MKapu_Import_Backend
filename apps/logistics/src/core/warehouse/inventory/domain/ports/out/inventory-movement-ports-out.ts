import { InventoryMovement } from '../../entity/inventory-movement.entity';
import { Stock } from '../../entity/stock-domain-intity';
import { EntityManager } from 'typeorm';

export interface IInventoryRepositoryPort {
  saveMovement(movement: InventoryMovement, manager?: EntityManager): Promise<void>;
  findStock(productId: number, warehouseId: number): Promise<Stock | null>;
  updateStock(stock: Stock): Promise<void>;
}
