import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TransferCommandService } from './transfer-command.service';
import { TransferPortsOut } from '../../domain/ports/out/transfer-ports-out';
import { UnitLockerRepository } from '../../infrastructure/adapters/out/unit-locker.repository';
import { TransferWebsocketGateway } from '../../infrastructure/adapters/out/transfer-websocket.gateway';
import { Transfer, TransferItem, TransferStatus } from '../../domain/entity/transfer-domain-entity';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-entity';
import { InventoryCommandService } from '../../../inventory/application/service/inventory-command.service';
import { StockOrmEntity } from '../../../inventory/infrastructure/entity/stock-orm-entity';
import { TransferOrmEntity } from '../../infrastructure/entity/transfer-orm.entity';

describe('TransferCommandService', () => {
  let service: TransferCommandService;
  let transferRepo: jest.Mocked<TransferPortsOut>;
  let unitLockerRepository: jest.Mocked<UnitLockerRepository>;
  let transferGateway: jest.Mocked<TransferWebsocketGateway>;
  let dataSource: jest.Mocked<DataSource>;
  let inventoryService: jest.Mocked<InventoryCommandService>;

  const createManager = () => {
    const stockRepo = { findOne: jest.fn().mockResolvedValue({ id_almacen: 10, id_sede: '1' }) };
    const transferRepoOrm = {
      metadata: { relations: [{ propertyName: 'details' }] },
      findOne: jest.fn().mockResolvedValue({ id: 1, status: TransferStatus.REQUESTED }),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 1, status: TransferStatus.REQUESTED }),
      })),
    };

    return {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === StockOrmEntity) return stockRepo;
        if (entity === TransferOrmEntity) return transferRepoOrm;
        return { metadata: { relations: [] }, findOne: jest.fn() };
      }),
    } as unknown as EntityManager;
  };

  beforeEach(() => {
    transferRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findByHeadquarters: jest.fn(),
      findAll: jest.fn(),
    };

    unitLockerRepository = {
      fetchUnitsBySeriesForUpdate: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      markUnitsTransferred: jest.fn(),
      releaseUnits: jest.fn(),
      moveToDestinationAndRelease: jest.fn(),
    } as unknown as jest.Mocked<UnitLockerRepository>;

    transferGateway = {
      notifyNewRequest: jest.fn(),
      notifyStatusChange: jest.fn(),
    } as unknown as jest.Mocked<TransferWebsocketGateway>;

    dataSource = {
      transaction: jest.fn(async (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback(createManager()),
      ),
      createQueryRunner: jest.fn(() => ({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: createManager(),
      })),
    } as unknown as jest.Mocked<DataSource>;

    inventoryService = {
      getStockLevel: jest.fn().mockResolvedValue(999),
      registerMovementFromTransfer: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<InventoryCommandService>;

    service = new TransferCommandService(
      transferRepo,
      dataSource,
      unitLockerRepository,
      transferGateway,
      {} as never,
      {} as never,
      {} as never,
      inventoryService,
    );
  });

  it('no permite solicitar con serie no DISPONIBLE', async () => {
    unitLockerRepository.fetchUnitsBySeriesForUpdate.mockResolvedValue([
      {
        serie: 'S-1',
        estado: UnitStatus.TRANSFERRING,
        id_almacen: 10,
        id_producto: 100,
      } as never,
    ]);

    await expect(
      service.requestTransfer({
        originHeadquartersId: '1',
        originWarehouseId: 10,
        destinationHeadquartersId: '2',
        destinationWarehouseId: 20,
        userId: 999,
        items: [{ productId: 100, series: ['S-1'] }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('solicitud crea transferencia SOLICITADA y no toca estado de series', async () => {
    unitLockerRepository.fetchUnitsBySeriesForUpdate.mockResolvedValue([
      {
        serie: 'S-1',
        estado: UnitStatus.AVAILABLE,
        id_almacen: 10,
        id_producto: 100,
      } as never,
      {
        serie: 'S-2',
        estado: UnitStatus.AVAILABLE,
        id_almacen: 10,
        id_producto: 100,
      } as never,
    ]);

    transferRepo.save.mockImplementation(async (transfer: Transfer) => {
      transfer.id = 77;
      return transfer;
    });

    const result = await service.requestTransfer({
      originHeadquartersId: '1',
      originWarehouseId: 10,
      destinationHeadquartersId: '2',
      destinationWarehouseId: 20,
      userId: 99,
      items: [{ productId: 100, series: ['S-1', 'S-2'] }],
    });

    expect(result.status).toBe(TransferStatus.REQUESTED);
    expect(result.totalQuantity).toBe(2);
    expect(unitLockerRepository.markUnitsTransferred).not.toHaveBeenCalled();
    expect(transferGateway.notifyNewRequest).toHaveBeenCalledTimes(1);
  });

  it('reject revierte series a DISPONIBLE', async () => {
    const transfer = new Transfer(
      '1',
      10,
      '2',
      20,
      [new TransferItem(100, ['S-1'])],
      undefined,
      10,
      1,
      TransferStatus.REQUESTED,
    );

    transferRepo.findById.mockResolvedValue(transfer);
    transferRepo.save.mockImplementation(async (t: Transfer) => t);
    unitLockerRepository.fetchUnitsBySeriesForUpdate.mockResolvedValue([
      { serie: 'S-1', estado: UnitStatus.TRANSFERRING } as never,
    ]);

    const result = await service.rejectTransfer(10, { userId: 50, reason: 'No procede' });

    expect(result.status).toBe(TransferStatus.REJECTED);
    expect(unitLockerRepository.releaseUnits).toHaveBeenCalledWith(
      ['S-1'],
      expect.anything(),
    );
  });

  it('confirmReceipt deja COMPLETADA y series DISPONIBLE en destino', async () => {
    const transfer = new Transfer(
      '1',
      10,
      '2',
      20,
      [new TransferItem(100, ['S-1', 'S-2'])],
      undefined,
      12,
      1,
      TransferStatus.APPROVED,
    );

    transferRepo.save.mockImplementation(async (t: Transfer) => t);
    unitLockerRepository.fetchUnitsBySeriesForUpdate.mockResolvedValue([
      { serie: 'S-1', estado: UnitStatus.TRANSFERRING, id_almacen: 10 } as never,
      { serie: 'S-2', estado: UnitStatus.TRANSFERRING, id_almacen: 10 } as never,
    ]);
    const queryRunner = dataSource.createQueryRunner() as unknown as QueryRunner;
    (queryRunner.manager.getRepository as jest.Mock).mockImplementation((entity: unknown) => {
      if (entity === TransferOrmEntity) {
        return {
          createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({
              id: 12,
              originWarehouseId: 10,
              destinationWarehouseId: 20,
              date: new Date(),
              status: TransferStatus.APPROVED,
              motive: null,
              details: [
                { productId: 100, serialNumber: 'S-1' },
                { productId: 100, serialNumber: 'S-2' },
              ],
            }),
          })),
        };
      }
      if (entity === StockOrmEntity) {
        return {
          findOne: jest.fn().mockImplementation(({ where }: any) =>
            Promise.resolve({
              id_sede: where.id_almacen === 10 ? '1' : '2',
            }),
          ),
        };
      }
      return {};
    });

    const result = await service.confirmReceipt(12, { userId: 88 });

    expect(result.status).toBe(TransferStatus.COMPLETED);
    expect(unitLockerRepository.moveToDestinationAndRelease).toHaveBeenCalledWith(
      ['S-1', 'S-2'],
      '2',
      20,
      expect.anything(),
    );
    expect(inventoryService.registerMovementFromTransfer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transferId: 12,
        originWarehouseId: 10,
        destinationWarehouseId: 20,
      }),
    );
    expect(transferGateway.notifyStatusChange).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ status: TransferStatus.COMPLETED }),
    );
    expect(transferGateway.notifyStatusChange).toHaveBeenCalledWith(
      '2',
      expect.objectContaining({ status: TransferStatus.COMPLETED }),
    );
  });

  it('approve marca series TRANSFERIDO', async () => {
    const transfer = new Transfer(
      '1',
      10,
      '2',
      20,
      [new TransferItem(100, ['S-1'])],
      undefined,
      9,
      1,
      TransferStatus.REQUESTED,
    );
    transferRepo.findById.mockResolvedValue(transfer);
    transferRepo.save.mockImplementation(async (t: Transfer) => t);
    unitLockerRepository.fetchUnitsBySeriesForUpdate.mockResolvedValue([
      {
        serie: 'S-1',
        estado: UnitStatus.AVAILABLE,
        id_almacen: 10,
        id_producto: 100,
      } as never,
    ]);

    const result = await service.approveTransfer(9, { userId: 20 });

    expect(result.status).toBe(TransferStatus.APPROVED);
    expect(unitLockerRepository.markUnitsTransferred).toHaveBeenCalledWith(
      ['S-1'],
      expect.anything(),
    );
  });
});
