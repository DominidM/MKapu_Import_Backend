/* apps/logistics/src/core/inventory/application/service/inventory-command.service.ts */

import { Inject, Injectable } from "@nestjs/common";
import { 
  IInventoryMovementCommandPort, 
  MovementRequest 
} from "../../domain/ports/in/inventory-movement-ports-in.";
import { CreateInventoryMovementDto } from "../dto/in/create-inventory-movement.dto";
import { IInventoryRepositoryPort } from "../../domain/ports/out/inventory-movement-ports-out";
import { InventoryMapper } from "../mapper/inventory.mapper";

@Injectable()
export class InventoryCommandService implements IInventoryMovementCommandPort {
  
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
  ) {}

  /**
   * Obtiene el nivel de stock actual para un producto en un almacén específico.
   * Validando que el registro de stock esté activo (Estado '1' o 'AVAILABLE').
   */
  async getStockLevel(productId: number, warehouseId: number): Promise<number> {
    // 1. Buscamos el registro en la tabla 'stock' a través del repositorio
    const stock = await this.repository.findStock(productId, warehouseId);
    
    if (!stock) return 0;

    // 2. Validación de estado híbrida para no romper con la "limpieza" de la DB
    // Aceptamos '1' (tu nuevo estándar), 'AVAILABLE' o 'ACTIVO'
    const statusStr = String(stock.status || stock.status || '').toUpperCase();
    const isActive = statusStr === '1' || statusStr === 'AVAILABLE' || statusStr === 'ACTIVO';

    // 3. Retornamos la cantidad solo si el registro está habilitado
    return isActive ? stock.quantity : 0;
  }

  /**
   * Ejecuta la persistencia del movimiento en la base de datos.
   */
  async executeMovement(dto: CreateInventoryMovementDto): Promise<void> {
    const movement = InventoryMapper.toDomain(dto);
    await this.repository.saveMovement(movement);
  }

  /**
   * Registra una entrada de stock (Usado en confirm-receipt de transferencias).
   */
  async registerIncome(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map(item => ({ 
        ...item, 
        type: 'INGRESO' 
      }))
    };
    await this.executeMovement(fullDto);
  }

  /**
   * Registra una salida de stock (Usado en approve de transferencias).
   */
  async registerExit(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map(item => ({ 
        ...item, 
        type: 'SALIDA' 
      }))
    };
    await this.executeMovement(fullDto);
  }
}