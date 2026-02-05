/* apps/logistics/src/core/warehouse/inventory/domain/ports/out/inventory-repository.port.out.ts */
import { InventoryMovement } from '../../entity/inventory-movement.entity';
import { Stock } from '../../entity/stock-domain-intity';

export interface IInventoryRepositoryPort {
  saveMovement(movement: InventoryMovement): Promise<void>;
  findStock(productId: number, warehouseId: number): Promise<Stock | null>;
  
  // El Trigger se encarga del update, pero podrías necesitarlo para otros casos:
  updateStock(stock: Stock): Promise<void>;
}