import { DataSource, Repository } from 'typeorm';
import { InventoryMovementPortsOut } from '../../../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMovementOrmEntity } from '../../../entity/inventory-movement-orm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryMovement } from '../../../../domain/entity/inventory-movement.entity';
import { Injectable } from '@nestjs/common';
import { InventoryMovementDetailOrmEntity } from '../../../entity/inventory-movement-detail-orm.entity';

export interface SaveMovementDto {
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
@Injectable()
export class InventoryMovementRepository implements InventoryMovementPortsOut {
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly movementRepo: Repository<InventoryMovementOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}
  async save(movement: InventoryMovement): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const movementorm = this.movementRepo.create({
        originType: movement.originType,
        refId: movement.refId,
        refTable: movement.refTable,
        observation: movement.observation,
      });
      const savedMovement = await queryRunner.manager.save(movementorm);
      const details = movement.items.map((item) => {
        return queryRunner.manager.create(InventoryMovementDetailOrmEntity, {
          movementId: savedMovement.id,
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          type: item.type,
        });
      });
      await queryRunner.manager.save(details);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
