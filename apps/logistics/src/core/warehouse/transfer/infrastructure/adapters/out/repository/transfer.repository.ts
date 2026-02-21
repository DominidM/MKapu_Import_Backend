/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { TransferPortsOut } from '../../../../domain/ports/out/transfer-ports-out';
import {
  Transfer,
  TransferMode,
  TransferStatus,
} from '../../../../domain/entity/transfer-domain-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { TransferDetailOrmEntity } from '../../../entity/transfer-detail-orm.entity';
import { TransferOrmEntity } from '../../../entity/transfer-orm.entity';
import { TransferMapper } from '../../../../application/mapper/transfer-mapper';
import { StockOrmEntity } from '../../../../../inventory/infrastructure/entity/stock-orm-entity';

@Injectable()
export class TransferRepository implements TransferPortsOut {
  constructor(
    @InjectRepository(TransferOrmEntity)
    private readonly transferRepo: Repository<TransferOrmEntity>,
    @InjectRepository(TransferDetailOrmEntity)
    private readonly detailRepo: Repository<TransferDetailOrmEntity>,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>
  ) {}
  async save(transfer: Transfer, manager?: EntityManager): Promise<Transfer> {
    const repository = manager
      ? manager.getRepository(TransferOrmEntity)
      : this.transferRepo;
    const detailRepository = manager
      ? manager.getRepository(TransferDetailOrmEntity)
      : this.detailRepo;

    const existingEntity = transfer.id
      ? await repository.findOne({ where: { id: transfer.id } })
      : null;

    const entity: TransferOrmEntity = repository.create({
      id: transfer.id,
      userIdRefOrigin:
        existingEntity?.userIdRefOrigin ?? Number(transfer.creatorUserId),
      userIdRefDest:
        transfer.id && transfer.approveUserId
          ? Number(transfer.approveUserId)
          : existingEntity?.userIdRefDest ?? null,
      originWarehouseId: transfer.originWarehouseId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      date: transfer.requestDate,
      status: transfer.status,
      motive: transfer.observation,
      operationType:
        transfer.mode === TransferMode.AGGREGATED
          ? 'TRANSFERENCIA_AGGREGATED'
          : 'TRANSFERENCIA',
    });
    const savedEntity: TransferOrmEntity = await repository.save(entity);
    if (!transfer.id) {
      const detailEntities: TransferDetailOrmEntity[] = [];

      if (transfer.mode === TransferMode.AGGREGATED) {
        transfer.items.forEach((item, idx) => {
          const detail = detailRepository.create({
            transferId: savedEntity.id,
            productId: item.productId,
            serialNumber: `AGG-${savedEntity.id}-${item.productId}-${idx + 1}`,
            quantity: item.quantity,
          });
          detailEntities.push(detail);
        });
      } else {
        for (const item of transfer.items) {
          for (const serie of item.series) {
            const detail = detailRepository.create({
              transferId: savedEntity.id,
              productId: item.productId,
              serialNumber: serie,
              quantity: 1,
            });
            detailEntities.push(detail);
          }
        }
      }
      await detailRepository.save(detailEntities);
    }
    transfer.id = savedEntity.id;
    return transfer;
  }
  async findById(id: number): Promise<Transfer | null> {
    const entity = await this.transferRepo.findOne({where: {id}, relations:['details']});
    if (!entity) return null;
    //Origen
    const originHq = await this.getHeadquartersByWarehouse(entity.originWarehouseId);
    //Destino
    const destHq = await this.getHeadquartersByWarehouse(entity.destinationWarehouseId);
    return TransferMapper.mapToDomain(entity, originHq, destHq);
  }
  async updateStatus(
    id: number,
    status: TransferStatus,
  ): Promise<void> {
    await this.transferRepo.update(id, { status });
  }
  async findByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    const warehouses = await this.stockRepo
      .createQueryBuilder('stock')
      .select('DISTINCT stock.id_almacen', 'id')
      .where('stock.id_sede = :hqId', { hqId: headquartersId })
      .getRawMany();
      const warehouseIds = warehouses.map((w) => w.id);
      if (warehouseIds.length === 0) return [];
      const entities = await this.transferRepo.find({
        where: [
          { originWarehouseId: In(warehouseIds) },
          { destinationWarehouseId: In(warehouseIds) },
        ],
        relations: ['details'],
        order: { date: 'DESC' },
      });
    return Promise.all(entities.map(async e => {
       // Para ser precisos, resolvemos ambos lados
       const originHq = await this.getHeadquartersByWarehouse(e.originWarehouseId);
       const destHq = await this.getHeadquartersByWarehouse(e.destinationWarehouseId);
       return TransferMapper.mapToDomain(e, originHq, destHq);
    }));
  }
  async findAll(): Promise<Transfer[]> {
    const entities = await this.transferRepo.find({
      relations: ['details'],
      order: { date: 'DESC' },
    });
    return Promise.all(entities.map(async e => {
      const originHq = await this.getHeadquartersByWarehouse(e.originWarehouseId);
      const destHq = await this.getHeadquartersByWarehouse(e.destinationWarehouseId);
      return TransferMapper.mapToDomain(e, originHq, destHq);
    }));
  }
  private async getHeadquartersByWarehouse(warehouseId: number): Promise<string> {
    const row = await this.stockRepo
      .createQueryBuilder('stock')
      .select('stock.id_sede', 'id_sede')
      .where('stock.id_almacen = :warehouseId', { warehouseId })
      .groupBy('stock.id_sede')
      .orderBy('stock.id_sede', 'ASC')
      .limit(1)
      .getRawOne<{ id_sede: string }>();
    return row?.id_sede ?? 'SIN-SEDE';
  }
}
