import { NotFoundException } from '@nestjs/common';
import { IInventoryRepositoryPort } from '../../domain/ports/out/inventory-movement-ports-out';
import { Stock } from '../../domain/entity/stock-domain-intity';
import { InventoryQueryService } from './inventory-query.service';
import { UnitLockerRepository } from 'apps/logistics/src/core/warehouse/transfer/infrastructure/adapters/out/unit-locker.repository';

describe('InventoryQueryService', () => {
  let service: InventoryQueryService;
  let repository: jest.Mocked<IInventoryRepositoryPort>;
  let unitLockerRepository: jest.Mocked<UnitLockerRepository>;

  beforeEach(() => {
    repository = {
      saveMovement: jest.fn(),
      findStock: jest.fn(),
      updateStock: jest.fn(),
    };

    unitLockerRepository = {
      getAvailabilitySnapshot: jest.fn(),
    } as unknown as jest.Mocked<UnitLockerRepository>;

    service = new InventoryQueryService(repository, unitLockerRepository);
  });

  it('retorna disponibilidad serializada por producto/almacen', async () => {
    unitLockerRepository.getAvailabilitySnapshot.mockResolvedValue({
      productId: 10,
      warehouseId: 2,
      totalUnits: 20,
      availableUnits: 12,
      byStatus: {
        DISPONIBLE: 12,
        TRANSFERIDO: 8,
        VENDIDO: 0,
        MERMA: 0,
        BAJA: 0,
      },
      sampleAvailableSeries: ['SER-1', 'SER-2'],
    });

    const result = await service.getSerializedUnitsAvailability(10, 2);

    expect(result.productId).toBe(10);
    expect(result.warehouseId).toBe(2);
    expect(result.availableUnits).toBe(12);
    expect(result.sampleAvailableSeries).toEqual(['SER-1', 'SER-2']);
  });

  it('lanza 404 cuando no hay stock agregado', async () => {
    repository.findStock.mockResolvedValue(null);

    await expect(service.getStock(10, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('retorna stock agregado cuando existe', async () => {
    repository.findStock.mockResolvedValue(
      new Stock(1, 10, 2, '2', 35, 'ALMACEN', '1'),
    );

    const result = await service.getStock(10, 2);
    expect(result.productId).toBe(10);
    expect(result.warehouseId).toBe(2);
    expect(result.quantity).toBe(35);
  });
});
