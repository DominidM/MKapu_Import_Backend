import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-entity';
import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import {
  IUnitSeriesRepositoryPort,
  UnitSeriesRecord,
} from '../../domain/ports/out/unit-series-ports-out';

type GenerateUnitSeriesParams = {
  productId: number;
  warehouseId: number;
  quantity: number;
  manager?: EntityManager;
  expirationDate?: Date;
  status?: UnitStatus;
};

@Injectable()
export class UnitSeriesGeneratorService {
  private static readonly MAX_ATTEMPTS_PER_UNIT = 10;

  constructor(
    @Inject('IUnitSeriesRepositoryPort')
    private readonly unitSeriesRepository: IUnitSeriesRepositoryPort,
  ) {}

  async generateAndCreate(
    params: GenerateUnitSeriesParams,
  ): Promise<string[]> {
    const {
      productId,
      warehouseId,
      quantity,
      manager,
      expirationDate = new Date('2099-12-31'),
      status = UnitStatus.AVAILABLE,
    } = params;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ConflictException(
        `Invalid quantity for series generation: ${quantity}`,
      );
    }

    const records: UnitSeriesRecord[] = [];
    const generated = new Set<string>();

    for (let i = 0; i < quantity; i += 1) {
      let resolvedSeries: string | null = null;

      for (
        let attempt = 0;
        attempt < UnitSeriesGeneratorService.MAX_ATTEMPTS_PER_UNIT;
        attempt += 1
      ) {
        const candidate = this.buildSeries(productId, warehouseId);
        if (generated.has(candidate)) continue;

        const exists = await this.unitSeriesRepository.existsBySeries(
          candidate,
          manager,
        );
        if (exists) continue;

        resolvedSeries = candidate;
        break;
      }

      if (!resolvedSeries) {
        throw new ConflictException(
          `Unable to generate unique series for product ${productId} in warehouse ${warehouseId}`,
        );
      }

      generated.add(resolvedSeries);
      records.push({
        productId,
        warehouseId,
        serialNumber: resolvedSeries,
        expirationDate,
        status,
      });
    }

    await this.unitSeriesRepository.createMany(records, manager);
    return records.map((record) => record.serialNumber);
  }

  private buildSeries(productId: number, warehouseId: number): string {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    return `SERIE-${productId}-${warehouseId}-${suffix}`;
  }
}
