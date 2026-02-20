import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-entity';
import { UnitOrmEntity } from 'apps/logistics/src/core/catalog/unit/infrastructure/entity/unit-orm.entity';
import { EntityManager, In, Repository } from 'typeorm';

@Injectable()
export class UnitLockerRepository {
  constructor(
    @InjectRepository(UnitOrmEntity)
    private readonly unitRepository: Repository<UnitOrmEntity>,
  ) {}

  async fetchUnitsBySeriesForUpdate(
    series: string[],
    manager?: EntityManager,
  ): Promise<UnitOrmEntity[]> {
    if (series.length === 0) return [];

    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    return repository
      .createQueryBuilder('unit')
      .select([
        'unit.id_unidad',
        'unit.id_producto',
        'unit.id_almacen',
        'unit.serie',
        'unit.estado',
      ])
      .where('unit.serie IN (:...series)', { series })
      .setLock('pessimistic_write')
      .getMany();
  }

  async bulkUpdateStatus(
    series: string[],
    status: UnitStatus,
    manager?: EntityManager,
  ): Promise<void> {
    if (series.length === 0) return;

    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    await repository.update({ serie: In(series) }, { estado: status });
  }

  async markUnitsTransferred(
    series: string[],
    manager?: EntityManager,
  ): Promise<void> {
    await this.bulkUpdateStatus(series, UnitStatus.TRANSFERRING, manager);
  }

  async releaseUnits(series: string[], manager?: EntityManager): Promise<void> {
    await this.bulkUpdateStatus(series, UnitStatus.AVAILABLE, manager);
  }

  async updateLocationIfExists(
    series: string[],
    destinationHqId: string,
    destinationWarehouseId: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (series.length === 0) return;

    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    const metadata = repository.metadata;
    const hasWarehouseColumn =
      metadata.findColumnWithPropertyName('id_almacen');

    if (hasWarehouseColumn) {
      await repository.update(
        { serie: In(series) },
        { id_almacen: destinationWarehouseId },
      );
    }

    void destinationHqId;
  }

  async moveToDestinationAndRelease(
    series: string[],
    destinationHqId: string,
    destinationWarehouseId: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (series.length === 0) return;

    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    const metadata = repository.metadata;
    const hasWarehouseColumn =
      metadata.findColumnWithPropertyName('id_almacen');
    if (!hasWarehouseColumn) {
      return;
    }

    await repository.update(
      { serie: In(series) },
      {
        id_almacen: destinationWarehouseId,
        estado: UnitStatus.AVAILABLE,
      },
    );

    void destinationHqId;
  }
}
