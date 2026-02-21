import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-entity';
import { UnitOrmEntity } from 'apps/logistics/src/core/catalog/unit/infrastructure/entity/unit-orm.entity';
import { EntityManager, In, Repository } from 'typeorm';

export type UnitsAvailabilitySnapshot = {
  productId: number;
  warehouseId: number;
  totalUnits: number;
  availableUnits: number;
  byStatus: Record<string, number>;
  sampleAvailableSeries: string[];
};

@Injectable()
export class UnitLockerRepository {
  private static readonly AVAILABLE_EQUIVALENT_STATUSES_NORMALIZED = [
    UnitStatus.AVAILABLE,
    'AVAILABLE',
    'ACTIVO',
    '1',
  ].map((status) => status.trim().toUpperCase());
  private static readonly DEFAULT_STATUS_KEYS = [
    UnitStatus.AVAILABLE,
    UnitStatus.TRANSFERRING,
    UnitStatus.SOLD,
    UnitStatus.DAMAGED,
    UnitStatus.DISCARDED,
  ];

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

  async fetchAvailableUnitsByProductForUpdate(
    productId: number,
    warehouseId: number,
    quantity: number,
    excludedSeries: string[] = [],
    manager?: EntityManager,
  ): Promise<UnitOrmEntity[]> {
    if (quantity <= 0) return [];

    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    const queryBuilder = repository
      .createQueryBuilder('unit')
      .select([
        'unit.id_unidad',
        'unit.id_producto',
        'unit.id_almacen',
        'unit.serie',
        'unit.estado',
      ])
      .where('unit.id_producto = :productId', { productId })
      .andWhere('unit.id_almacen = :warehouseId', { warehouseId })
      .andWhere('UPPER(TRIM(unit.estado)) IN (:...availableStatuses)', {
        availableStatuses:
          UnitLockerRepository.AVAILABLE_EQUIVALENT_STATUSES_NORMALIZED,
      })
      .orderBy('unit.id_unidad', 'ASC')
      .limit(quantity)
      .setLock('pessimistic_write');

    if (excludedSeries.length > 0) {
      queryBuilder.andWhere('unit.serie NOT IN (:...excludedSeries)', {
        excludedSeries,
      });
    }

    return queryBuilder.getMany();
  }

  async countAvailableUnitsByProduct(
    productId: number,
    warehouseId: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    return repository
      .createQueryBuilder('unit')
      .where('unit.id_producto = :productId', { productId })
      .andWhere('unit.id_almacen = :warehouseId', { warehouseId })
      .andWhere('UPPER(TRIM(unit.estado)) IN (:...availableStatuses)', {
        availableStatuses:
          UnitLockerRepository.AVAILABLE_EQUIVALENT_STATUSES_NORMALIZED,
      })
      .getCount();
  }

  async getStatusBreakdownByProduct(
    productId: number,
    warehouseId: number,
    manager?: EntityManager,
  ): Promise<Array<{ status: string; count: number }>> {
    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    const rows = await repository
      .createQueryBuilder('unit')
      .select('UPPER(TRIM(unit.estado))', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('unit.id_producto = :productId', { productId })
      .andWhere('unit.id_almacen = :warehouseId', { warehouseId })
      .groupBy('UPPER(TRIM(unit.estado))')
      .orderBy('count', 'DESC')
      .getRawMany<{ status: string; count: string }>();

    return rows.map((row) => ({
      status: row.status ?? 'NULL',
      count: Number(row.count ?? 0),
    }));
  }

  async getAvailabilitySnapshot(
    productId: number,
    warehouseId: number,
    manager?: EntityManager,
  ): Promise<UnitsAvailabilitySnapshot> {
    const statusRows = await this.getStatusBreakdownByProduct(
      productId,
      warehouseId,
      manager,
    );
    const sampleAvailableSeries = await this.getSampleAvailableSeries(
      productId,
      warehouseId,
      20,
      manager,
    );

    const byStatus: Record<string, number> = {};
    UnitLockerRepository.DEFAULT_STATUS_KEYS.forEach((status) => {
      byStatus[status] = 0;
    });

    let totalUnits = 0;
    let availableUnits = 0;
    statusRows.forEach((statusRow) => {
      const canonicalStatus = this.toCanonicalStatus(statusRow.status);
      byStatus[canonicalStatus] = (byStatus[canonicalStatus] ?? 0) + statusRow.count;
      totalUnits += statusRow.count;
      if (canonicalStatus === UnitStatus.AVAILABLE) {
        availableUnits += statusRow.count;
      }
    });

    return {
      productId,
      warehouseId,
      totalUnits,
      availableUnits,
      byStatus,
      sampleAvailableSeries,
    };
  }

  async getSampleAvailableSeries(
    productId: number,
    warehouseId: number,
    limit = 20,
    manager?: EntityManager,
  ): Promise<string[]> {
    const repository = manager
      ? manager.getRepository(UnitOrmEntity)
      : this.unitRepository;

    const rows = await repository
      .createQueryBuilder('unit')
      .select('unit.serie', 'serie')
      .where('unit.id_producto = :productId', { productId })
      .andWhere('unit.id_almacen = :warehouseId', { warehouseId })
      .andWhere('UPPER(TRIM(unit.estado)) IN (:...availableStatuses)', {
        availableStatuses:
          UnitLockerRepository.AVAILABLE_EQUIVALENT_STATUSES_NORMALIZED,
      })
      .orderBy('unit.id_unidad', 'ASC')
      .limit(limit)
      .getRawMany<{ serie: string }>();

    return rows.map((row) => row.serie);
  }

  private toCanonicalStatus(rawStatus: string): string {
    const normalized = String(rawStatus ?? '').trim().toUpperCase();
    if (
      UnitLockerRepository.AVAILABLE_EQUIVALENT_STATUSES_NORMALIZED.includes(
        normalized,
      )
    ) {
      return UnitStatus.AVAILABLE;
    }
    return normalized || 'UNKNOWN';
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
