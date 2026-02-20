/* apps/logistics/src/core/inventory/application/service/inventory-command.service.ts */

import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { 
  IInventoryMovementCommandPort, 
  MovementRequest 
} from "../../domain/ports/in/inventory-movement-ports-in.";
import { CreateInventoryMovementDto } from "../dto/in/create-inventory-movement.dto";
import { IInventoryRepositoryPort } from "../../domain/ports/out/inventory-movement-ports-out";
import { InventoryMapper } from "../mapper/inventory.mapper";
import { EntityManager, In } from 'typeorm';
import { InventoryMovementOrmEntity } from '../../infrastructure/entity/inventory-movement-orm.entity';
import { StockOrmEntity } from '../../infrastructure/entity/stock-orm-intity';

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

  async registerMovementFromTransfer(
    manager: EntityManager,
    params: {
      transferId: number;
      originWarehouseId: number;
      destinationWarehouseId: number;
      originHeadquartersId: string;
      destinationHeadquartersId: string;
      groupedItems: Array<{ productId: number; quantity: number }>;
      observation?: string;
    },
  ): Promise<void> {
    const {
      transferId,
      originWarehouseId,
      destinationWarehouseId,
      originHeadquartersId,
      destinationHeadquartersId,
      groupedItems,
      observation,
    } = params;

    if (groupedItems.length === 0) return;

    const stockRepository = manager.getRepository(StockOrmEntity);
    const movementRepository = manager.getRepository(InventoryMovementOrmEntity);
    const productIds = groupedItems.map((item) => item.productId);

    const stocks = await stockRepository.find({
      where: {
        id_producto: In(productIds),
        id_almacen: In([originWarehouseId, destinationWarehouseId]),
      },
    });

    const stockByProductAndWarehouse = new Map<string, StockOrmEntity>();
    stocks.forEach((stock) => {
      stockByProductAndWarehouse.set(
        `${stock.id_producto}:${stock.id_almacen}`,
        stock,
      );
    });

    const stockUpdates: StockOrmEntity[] = [];
    const stockInserts: StockOrmEntity[] = [];
    const exitDetails: Array<{
      productId: number;
      warehouseId: number;
      quantity: number;
      type: 'SALIDA';
    }> = [];
    const incomeDetails: Array<{
      productId: number;
      warehouseId: number;
      quantity: number;
      type: 'INGRESO';
    }> = [];

    for (const item of groupedItems) {
      const originKey = `${item.productId}:${originWarehouseId}`;
      const destinationKey = `${item.productId}:${destinationWarehouseId}`;
      const originStock = stockByProductAndWarehouse.get(originKey);

      if (!originStock || originStock.cantidad < item.quantity) {
        throw new ConflictException(
          `Stock insuficiente para el producto ${item.productId} en el almacén de origen.`,
        );
      }
      originStock.cantidad -= item.quantity;
      stockUpdates.push(originStock);

      const destinationStock = stockByProductAndWarehouse.get(destinationKey);
      if (destinationStock) {
        destinationStock.cantidad += item.quantity;
        stockUpdates.push(destinationStock);
      } else {
        const createdDestinationStock = stockRepository.create({
          id_producto: item.productId,
          id_almacen: destinationWarehouseId,
          id_sede: destinationHeadquartersId,
          tipo_ubicacion: originStock?.tipo_ubicacion || 'ALMACEN',
          cantidad: item.quantity,
          estado: originStock?.estado || '1',
        });
        stockInserts.push(createdDestinationStock);
      }

      exitDetails.push({
        productId: item.productId,
        warehouseId: originWarehouseId,
        quantity: item.quantity,
        type: 'SALIDA',
      });
      incomeDetails.push({
        productId: item.productId,
        warehouseId: destinationWarehouseId,
        quantity: item.quantity,
        type: 'INGRESO',
      });
    }

    if (stockUpdates.length > 0) {
      await stockRepository.save(stockUpdates);
    }
    if (stockInserts.length > 0) {
      await stockRepository.save(stockInserts);
    }

    const exitMovement = movementRepository.create({
      originType: 'TRANSFERENCIA',
      refId: transferId,
      refTable: 'transfer',
      observation:
        observation ||
        `Salida por transferencia #${transferId} (${originHeadquartersId} -> ${destinationHeadquartersId})`,
      details: exitDetails,
    });

    const incomeMovement = movementRepository.create({
      originType: 'TRANSFERENCIA',
      refId: transferId,
      refTable: 'transfer',
      observation:
        observation ||
        `Ingreso por transferencia #${transferId} (${originHeadquartersId} -> ${destinationHeadquartersId})`,
      details: incomeDetails,
    });

    await movementRepository.save([exitMovement, incomeMovement]);
  }
}
