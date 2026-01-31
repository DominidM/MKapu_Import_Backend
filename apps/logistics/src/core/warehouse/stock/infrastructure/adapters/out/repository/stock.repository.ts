import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StockMapper } from '../../../../application/mapper/stock.mapper';
import { Stock } from '../../../../domain/entity/stock-domain-intity';
import { StockPortsOut } from '../../../../domain/ports/out/stock-ports-out';
import { StockOrmEntity } from '../../../entity/stock-orm-intity';

@Injectable()
export class StockRepository implements StockPortsOut {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StockOrmEntity)
    private readonly stockOrmRepo: Repository<StockOrmEntity>,
  ) {}
  
  async findByKeyWithLock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
  ): Promise<Stock | null> {
    const manager = this.dataSource.manager;

    const entity = await manager.findOne(StockOrmEntity, {
      where: {
        id_producto: productId,
        id_almacen: warehouseId,
        id_sede: headquartersId,
      },
      lock: { mode: 'pessimistic_write' },
    });

    return entity ? StockMapper.toDomain(entity) : null;
  }

  async save(stock: Stock): Promise<void> {
    const orm = StockMapper.toOrm(stock);
    await this.dataSource.manager.save(StockOrmEntity, orm);
  }
}