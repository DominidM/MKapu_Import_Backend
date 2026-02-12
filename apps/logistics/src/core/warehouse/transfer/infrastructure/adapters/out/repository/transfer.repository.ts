import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  Transfer,
  TransferMode,
  TransferStatus,
} from '../../../../domain/entity/transfer-domain-entity';
import { TransferPortsOut } from '../../../../domain/ports/out/transfer-ports-out';
import { TransferMapper } from '../../../../application/mapper/transfer-mapper';
import { StoreOrmEntity } from '../../../../../store/infrastructure/entity/store-orm.entity';
import { TransferDetailOrmEntity } from '../../../entity/transfer-detail-orm.entity';
import { TransferOrmEntity } from '../../../entity/transfer-orm.entity';
import { SedeAlmacenTcpProxy } from '../TCP/sede-almacen-tcp.proxy';

@Injectable()
export class TransferRepository implements TransferPortsOut {
  private readonly logger = new Logger(TransferRepository.name);

  constructor(
    @InjectRepository(TransferOrmEntity)
    private readonly transferRepo: Repository<TransferOrmEntity>,
    @InjectRepository(StoreOrmEntity)
    private readonly storeRepo: Repository<StoreOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly sedeAlmacenTcpProxy: SedeAlmacenTcpProxy,
  ) {}

  async save(transfer: Transfer, manager?: EntityManager): Promise<Transfer> {
    const entityManager = manager ?? this.dataSource.manager;
    const transferRepository = entityManager.getRepository(TransferOrmEntity);
    const detailRepository = entityManager.getRepository(
      TransferDetailOrmEntity,
    );

    if (transfer.id) {
      await transferRepository.update(transfer.id, {
        status: transfer.status,
        motive: transfer.observation ?? null,
        userIdRefDest: transfer.approveUserId ?? null,
      });
      return transfer;
    }

    const entity = transferRepository.create({
      originWarehouseId: transfer.originWarehouseId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      date: transfer.requestDate,
      status: transfer.status,
      motive: transfer.observation,
      operationType:
        transfer.mode === TransferMode.AGGREGATED
          ? 'TRANSFERENCIA_AGGREGATED'
          : 'TRANSFERENCIA',
      userIdRefOrigin: transfer.creatorUserId ?? 0,
      userIdRefDest: null,
    });

    const savedEntity = await transferRepository.save(entity);

    const detailEntities: TransferDetailOrmEntity[] = [];

    for (const item of transfer.items) {
      if (transfer.mode === TransferMode.AGGREGATED) {
        detailEntities.push(
          detailRepository.create({
            transferId: savedEntity.id,
            productId: item.productId,
            serialNumber: `QTY-${randomUUID()}`,
            quantity: item.quantity,
          }),
        );
        continue;
      }

      for (const serie of item.series) {
        detailEntities.push(
          detailRepository.create({
            transferId: savedEntity.id,
            productId: item.productId,
            serialNumber: serie,
            quantity: 1,
          }),
        );
      }
    }

    if (detailEntities.length > 0) {
      await detailRepository.save(detailEntities);
    }

    transfer.id = savedEntity.id;
    return transfer;
  }

  async findById(id: number): Promise<Transfer | null> {
    const entity = await this.transferRepo.findOne({
      where: { id },
      relations: ['details'],
    });

    if (!entity) return null;

    const headquartersMap = await this.resolveHeadquartersMap([
      entity.originWarehouseId,
      entity.destinationWarehouseId,
    ]);

    return TransferMapper.mapToDomain(
      entity,
      headquartersMap.get(entity.originWarehouseId) ?? 'SIN-SEDE',
      headquartersMap.get(entity.destinationWarehouseId) ?? 'SIN-SEDE',
    );
  }

  async updateStatus(id: number, status: TransferStatus): Promise<void> {
    await this.transferRepo.update(id, { status });
  }

  async findByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    const warehouseIds =
      await this.findWarehouseIdsByHeadquarters(headquartersId);

    if (warehouseIds.length === 0) return [];

    const entities = await this.transferRepo.find({
      where: [
        { originWarehouseId: In(warehouseIds) },
        { destinationWarehouseId: In(warehouseIds) },
      ],
      relations: ['details'],
      order: { date: 'DESC' },
    });

    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findNotificationCandidatesByHeadquarters(
    headquartersId: string,
  ): Promise<Transfer[]> {
    const warehouseIds =
      await this.findWarehouseIdsByHeadquarters(headquartersId);

    if (warehouseIds.length === 0) return [];

    const entities = await this.transferRepo.find({
      where: [
        { originWarehouseId: In(warehouseIds) },
        { destinationWarehouseId: In(warehouseIds) },
      ],
      order: { date: 'DESC' },
    });

    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findAll(): Promise<Transfer[]> {
    const entities = await this.transferRepo.find({
      relations: ['details'],
      order: { date: 'DESC' },
    });

    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findAllPaginated(
    page: number,
    pageSize: number,
    headquartersId: string,
  ): Promise<{ transfers: Transfer[]; total: number }> {
    const query = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.details', 'detail')
      .orderBy('transfer.date', 'DESC');

    const warehouseIds =
      await this.findWarehouseIdsByHeadquarters(headquartersId);

    if (warehouseIds.length === 0) {
      return { transfers: [], total: 0 };
    }

    query
      .andWhere(
        '(transfer.originWarehouseId IN (:...warehouseIds) OR transfer.destinationWarehouseId IN (:...warehouseIds))',
        { warehouseIds },
      )
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [entities, total] = await query.getManyAndCount();

    return {
      transfers: await this.mapEntitiesWithHeadquarters(entities),
      total,
    };
  }

  private async mapEntitiesWithHeadquarters(
    entities: TransferOrmEntity[],
  ): Promise<Transfer[]> {
    const warehouseIds = [
      ...new Set(
        entities.flatMap((e) => [
          e.originWarehouseId,
          e.destinationWarehouseId,
        ]),
      ),
    ];

    const headquartersMap = await this.resolveHeadquartersMap(warehouseIds);

    return entities.map((e) =>
      TransferMapper.mapToDomain(
        e,
        headquartersMap.get(e.originWarehouseId) ?? 'SIN-SEDE',
        headquartersMap.get(e.destinationWarehouseId) ?? 'SIN-SEDE',
      ),
    );
  }

  private async findWarehouseIdsByHeadquarters(
    headquartersId: string,
  ): Promise<number[]> {
    const tcpIds =
      await this.sedeAlmacenTcpProxy.findWarehouseIdsBySede(headquartersId);

    const storeRows = await this.storeRepo
      .createQueryBuilder('w')
      .select('w.id_almacen', 'id')
      .where('w.id_sede = :id', { id: Number(headquartersId) })
      .getRawMany();

    const storeIds = storeRows.map((r) => Number(r.id));

    return [...new Set([...tcpIds, ...storeIds])];
  }

  private async resolveHeadquartersMap(
    warehouseIds: number[],
  ): Promise<Map<number, string>> {
    const map = new Map<number, string>();

    const tcp =
      await this.sedeAlmacenTcpProxy.findHeadquartersByWarehouseIds(
        warehouseIds,
      );

    tcp.forEach((v, k) => map.set(k, String(v.id_sede)));

    return map;
  }
}