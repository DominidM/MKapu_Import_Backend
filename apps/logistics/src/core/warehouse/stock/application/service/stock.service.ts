import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Stock } from '../../domain/entity/stock-domain-intity';
import { StockPortsOut } from '../../domain/ports/out/stock-ports-out';
import { StockOrmEntity } from '../../infrastructure/entity/stock-orm-intity';
import { StockMapper } from '../mapper/stock.mapper';

@Injectable()
export class StockService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('StockPortsOut')
    private readonly stockRepo: StockPortsOut,
  ) {}

  async applyMovement(
    productId: number,
    warehouseId: number,
    headquartersId: string,
    delta: number,
    reason: 'VENTA' | 'COMPRA' | 'TRANSFERENCIA' | 'AJUSTE',
    referenceId?: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(StockOrmEntity);

      const entity = await repo.findOne({
        where: {
          id_producto: productId,
          id_almacen: warehouseId,
          id_sede: headquartersId,
        },
        lock: { mode: 'pessimistic_write' },
      });

      let stock: Stock;

      if (!entity) {
        if (delta < 0) {
          throw new Error('No existe stock para descontar');
        }

        stock = new Stock(
          undefined,
          productId,
          warehouseId,
          headquartersId,
          0,
          'ALMACEN',
          'DISPONIBLE',
        );
      } else {
        stock = StockMapper.toDomain(entity);
      }

      stock.applyMovement(delta);

      const orm = StockMapper.toOrm(stock);
      await repo.save(orm);
    });
  }
}