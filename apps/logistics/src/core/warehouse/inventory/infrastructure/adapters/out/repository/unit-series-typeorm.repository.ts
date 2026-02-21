import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitOrmEntity } from 'apps/logistics/src/core/catalog/unit/infrastructure/entity/unit-orm.entity';
import {
  IUnitSeriesRepositoryPort,
  UnitSeriesRecord,
} from '../../../../domain/ports/out/unit-series-ports-out';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UnitSeriesTypeOrmRepository implements IUnitSeriesRepositoryPort {
  constructor(
    @InjectRepository(UnitOrmEntity)
    private readonly unitRepo: Repository<UnitOrmEntity>,
  ) {}

  async existsBySeries(serial: string, manager?: EntityManager): Promise<boolean> {
    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepo;
    return repository.exist({ where: { serie: serial } });
  }

  async createMany(
    records: UnitSeriesRecord[],
    manager?: EntityManager,
  ): Promise<void> {
    if (records.length === 0) return;

    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepo;

    const entities = records.map((record) =>
      repository.create({
        id_producto: record.productId,
        id_almacen: record.warehouseId,
        serie: record.serialNumber,
        fec_venc: record.expirationDate,
        estado: record.status,
      }),
    );

    await repository.insert(entities);
  }
}
