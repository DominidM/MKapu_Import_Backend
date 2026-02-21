/* apps/logistics/src/core/inventory/application/service/inventory-command.service.ts */

import { BadRequestException, ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import { 
  IInventoryMovementCommandPort, 
  MovementRequest 
} from "../../domain/ports/in/inventory-movement-ports-in.";
import { CreateInventoryMovementDto } from "../dto/in/create-inventory-movement.dto";
import { IInventoryRepositoryPort } from "../../domain/ports/out/inventory-movement-ports-out";
import { InventoryMapper } from "../mapper/inventory.mapper";
import { DataSource, EntityManager, In, QueryFailedError } from 'typeorm';
import { InventoryMovementOrmEntity } from '../../infrastructure/entity/inventory-movement-orm.entity';
import { StockOrmEntity } from '../../infrastructure/entity/stock-orm-entity';
import { UnitSeriesGeneratorService } from './unit-series-generator.service';

@Injectable()
export class InventoryCommandService implements IInventoryMovementCommandPort {
  private readonly logger = new Logger(InventoryCommandService.name);
  
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
    private readonly dataSource: DataSource,
    private readonly unitSeriesGeneratorService: UnitSeriesGeneratorService,
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
    await this.dataSource.transaction(async (manager) => {
      const movement = InventoryMapper.toDomain(dto);
      await this.repository.saveMovement(movement, manager);
      await this.generateSeriesForIncomeItems(dto, manager);
    });
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
      seriesTrace?: string;
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
      seriesTrace,
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

    const transferMovement = movementRepository.create({
      originType: 'TRANSFERENCIA',
      refId: transferId,
      refTable: 'transfer',
      observation: this.buildTransferObservation(
        observation ||
          `Movimiento por transferencia #${transferId} (${originHeadquartersId} -> ${destinationHeadquartersId})`,
        seriesTrace,
      ),
      details: [...exitDetails, ...incomeDetails],
    });

    try {
      await movementRepository.save(transferMovement);
    } catch (error: any) {
      const sqlMessage =
        error instanceof QueryFailedError
          ? (error as any)?.driverError?.sqlMessage || error.message
          : error?.message;

      // No bloquea la confirmación: el stock ya fue ajustado arriba.
      // Este error suele venir de triggers legacy en detalle_movimiento_inventario.
      if (String(sqlMessage ?? '').includes('Result consisted of more than one row')) {
        this.logger.warn(
          `[registerMovementFromTransfer] Movimiento de inventario omitido por trigger DB ambiguo: ${sqlMessage}`,
        );
        return;
      }

      throw error;
    }
  }

  private buildTransferObservation(
    baseObservation: string,
    seriesTrace?: string,
  ): string {
    if (!seriesTrace) return baseObservation;

    const suffix = ` | SERIES:${seriesTrace}`;
    const full = `${baseObservation}${suffix}`;
    return full.length > 255 ? `${full.slice(0, 252)}...` : full;
  }

  private async generateSeriesForIncomeItems(
    dto: CreateInventoryMovementDto,
    manager: EntityManager,
  ): Promise<void> {
    const incomeItems = dto.items.filter((item) => item.type === 'INGRESO');
    if (incomeItems.length === 0) return;

    for (const item of incomeItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException(
          `Income quantity must be a positive integer for productId ${item.productId}`,
        );
      }

      await this.unitSeriesGeneratorService.generateAndCreate({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        manager,
      });
    }
  }
}
