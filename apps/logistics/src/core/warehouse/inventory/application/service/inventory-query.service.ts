import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInventoryRepositoryPort } from '../../domain/ports/out/inventory-movement-ports-out';
import { StockResponseDto } from '../dto/out/stock-response.dto';
import { InventoryMapper } from '../mapper/inventory.mapper';
import { UnitLockerRepository } from 'apps/logistics/src/core/warehouse/transfer/infrastructure/adapters/out/unit-locker.repository';
import { UnitsAvailabilityResponseDto } from '../dto/out/units-availability-response.dto';

@Injectable()
export class InventoryQueryService {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
    private readonly unitLockerRepository: UnitLockerRepository,
  ) {}

  async getStock(productId: number, warehouseId: number): Promise<StockResponseDto> {
    const stock = await this.repository.findStock(productId, warehouseId);
    
    if (!stock) {
      throw new NotFoundException(`No se encontró stock para el producto ${productId} en el almacén ${warehouseId}`);
    }

    return InventoryMapper.toStockResponseDto(stock);
  }

  async getSerializedUnitsAvailability(
    productId: number,
    warehouseId: number,
  ): Promise<UnitsAvailabilityResponseDto> {
    const snapshot = await this.unitLockerRepository.getAvailabilitySnapshot(
      productId,
      warehouseId,
    );

    return {
      productId: snapshot.productId,
      warehouseId: snapshot.warehouseId,
      totalUnits: snapshot.totalUnits,
      availableUnits: snapshot.availableUnits,
      byStatus: snapshot.byStatus,
      sampleAvailableSeries: snapshot.sampleAvailableSeries,
    };
  }
}
