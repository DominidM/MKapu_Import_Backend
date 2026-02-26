/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import {
  ApplyAdjustmentsDto,
  IInventoryMovementCommandPort,
  MovementRequest,
} from '../../../domain/ports/in/inventory-movement-ports-in.';
import { CreateInventoryMovementDto } from '../../dto/in/create-inventory-movement.dto';
import { IInventoryRepositoryPort } from '../../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMapper } from '../../mapper/inventory.mapper';

@Injectable()
export class InventoryCommandService implements IInventoryMovementCommandPort {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
  ) {}

  async getStockLevel(productId: number, warehouseId: number): Promise<number> {
    const stock = await this.repository.findStock(productId, warehouseId);
    if (!stock) return 0;
    const statusStr = String(stock.status || stock.status || '').toUpperCase();
    const isActive =
      statusStr === '1' || statusStr === 'AVAILABLE' || statusStr === 'ACTIVO';
    return isActive ? stock.quantity : 0;
  }

  async executeMovement(dto: CreateInventoryMovementDto): Promise<void> {
    const movement = InventoryMapper.toDomain(dto);
    await this.repository.saveMovement(movement);
  }

  async registerIncome(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({ ...item, type: 'INGRESO' })),
    };
    await this.executeMovement(fullDto);
  }

  async registerExit(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({ ...item, type: 'SALIDA' })),
    };
    await this.executeMovement(fullDto);
  }
  async applyInventoryAdjustments(dto: ApplyAdjustmentsDto): Promise<void> {
    const sobrantesParaIngreso = [];
    const faltantesParaSalida = [];

    // 1. Clasificamos las diferencias
    for (const item of dto.adjustments) {
      if (item.difference > 0) {
        sobrantesParaIngreso.push({
          productId: item.productId,
          warehouseId: item.warehouseId,
          sedeId: item.sedeId,
          quantity: Math.abs(item.difference),
        });
      } else if (item.difference < 0) {
        faltantesParaSalida.push({
          productId: item.productId,
          warehouseId: item.warehouseId,
          sedeId: item.sedeId,
          quantity: Math.abs(item.difference),
        });
      }
    }

    if (sobrantesParaIngreso.length > 0) {
      await this.registerIncome({
        originType: 'AJUSTE',
        refId: dto.refId,
        refTable: dto.refTable,
        observation: `Sobrantes por Ajuste de ${dto.refTable} #${dto.refId}`,
        items: sobrantesParaIngreso,
      });
    }

    if (faltantesParaSalida.length > 0) {
      await this.registerExit({
        originType: 'AJUSTE',
        refId: dto.refId,
        refTable: dto.refTable,
        observation: `Faltantes por Ajuste de ${dto.refTable} #${dto.refId}`,
        items: faltantesParaSalida,
      });
    }
  }
}
