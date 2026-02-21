import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInventoryRepositoryPort } from '../../../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMovement } from '../../../../domain/entity/inventory-movement.entity';
import { Stock } from '../../../../domain/entity/stock-domain-intity';
import { InventoryMovementOrmEntity } from '../../../entity/inventory-movement-orm.entity';
import { StockOrmEntity } from '../../../entity/stock-orm-entity';

@Injectable()
export class InventoryTypeOrmRepository implements IInventoryRepositoryPort {
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly movementRepo: Repository<InventoryMovementOrmEntity>,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
  ) {}

  async saveMovement(movement: InventoryMovement): Promise<void> {
    // 1. Mapear de Dominio a ORM (Cabecera)
    const movementOrm = this.movementRepo.create({
      originType: movement.originType,
      refId: movement.refId,
      refTable: movement.refTable,
      observation: movement.observation,
      date: movement.date,
      // 2. Mapear Detalles
      details: movement.items.map(item => ({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        type: item.type
      }))
    });

    // 3. Guardar (Esto dispara el Trigger en la DB al insertar los detalles)
    await this.movementRepo.save(movementOrm);
  }

  async findStock(productId: number, warehouseId: number): Promise<Stock | null> {
    const stockOrm = await this.stockRepo.findOne({ 
      where: { id_producto: productId, id_almacen: warehouseId } 
    });

    if (!stockOrm) return null;

    // Retornamos la entidad de dominio Stock que ya definiste
    return new Stock(
      stockOrm.id_stock,
      stockOrm.id_producto,
      stockOrm.id_almacen,
      stockOrm.id_sede,
      stockOrm.cantidad,
      stockOrm.tipo_ubicacion,
      stockOrm.estado
    );
  }

  async updateStock(stock: Stock): Promise<void> {
    await this.stockRepo.update(stock.id, { cantidad: stock.quantity });
  }
}