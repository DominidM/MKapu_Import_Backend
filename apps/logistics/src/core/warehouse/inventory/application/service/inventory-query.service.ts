import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInventoryRepositoryPort } from '../../domain/ports/out/inventory-movement-ports-out';
import { StockResponseDto } from '../dto/out/stock-response.dto';
import { InventoryMapper } from '../mapper/inventory.mapper';

@Injectable()
export class InventoryQueryService {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
  ) {}

  async getStock(productId: number, warehouseId: number): Promise<StockResponseDto> {
    const stock = await this.repository.findStock(productId, warehouseId);
    
    if (!stock) {
      throw new NotFoundException(`No se encontró stock para el producto ${productId} en el almacén ${warehouseId}`);
    }

    return InventoryMapper.toStockResponseDto(stock);
  }
}