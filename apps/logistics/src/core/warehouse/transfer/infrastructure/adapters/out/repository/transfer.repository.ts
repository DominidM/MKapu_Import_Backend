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
import axios from 'axios';

@Injectable()
export class TransferRepository implements TransferPortsOut {
  private static readonly MOTIVE_MAX_LENGTH = 50;

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
      motive: this.normalizeMotive(transfer.observation),
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

  private normalizeMotive(motive?: string): string | null {
    if (!motive) return null;
    const normalized = motive.trim();
    if (!normalized) return null;
    if (normalized.length <= TransferRepository.MOTIVE_MAX_LENGTH) {
      return normalized;
    }
    return `${normalized.slice(0, TransferRepository.MOTIVE_MAX_LENGTH - 3)}...`;
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
    const warehousesFromStock = await this.stockRepo
      .createQueryBuilder('stock')
      .select('DISTINCT stock.id_almacen', 'id')
      .where('stock.id_sede = :hqId', { hqId: headquartersId })
      .getRawMany();

    const stockWarehouseIds = warehousesFromStock
      .map((warehouse) => Number(warehouse.id))
      .filter((id) => Number.isFinite(id) && id > 0);

    const assignedWarehouseIds =
      await this.findWarehouseIdsByHeadquartersAssignment(headquartersId);

    const warehouseIds = Array.from(
      new Set<number>([...stockWarehouseIds, ...assignedWarehouseIds]),
    );

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

    if (row?.id_sede) {
      return row.id_sede;
    }

    const assignedHeadquarterId =
      await this.findHeadquartersAssignmentByWarehouseId(warehouseId);
    if (assignedHeadquarterId) {
      return assignedHeadquarterId;
    }

    const assignedHeadquarterFromApi =
      await this.findHeadquartersAssignmentByWarehouseApi(warehouseId);
    if (assignedHeadquarterFromApi) {
      return assignedHeadquarterFromApi;
    }

    return 'SIN-SEDE';
  }

  private async findHeadquartersAssignmentByWarehouseId(
    warehouseId: number,
  ): Promise<string | null> {
    const adminDb = this.getAdminDatabaseName();
    if (!adminDb) return null;

    try {
      const rows = await this.stockRepo.query(
        `SELECT sa.id_sede AS id_sede
         FROM \`${adminDb}\`.\`sede_almacen\` sa
         WHERE sa.id_almacen_ref = ?
         LIMIT 1`,
        [warehouseId],
      );

      const idSede = rows?.[0]?.id_sede;
      if (idSede === undefined || idSede === null) {
        return null;
      }

      const normalized = String(idSede).trim();
      return normalized ? normalized : null;
    } catch {
      return null;
    }
  }

  private async findWarehouseIdsByHeadquartersAssignment(
    headquartersId: string,
  ): Promise<number[]> {
    const adminDb = this.getAdminDatabaseName();
    if (adminDb) {
      try {
        const rows = await this.stockRepo.query(
          `SELECT sa.id_almacen_ref AS id_almacen_ref
           FROM \`${adminDb}\`.\`sede_almacen\` sa
           WHERE sa.id_sede = ?`,
          [headquartersId],
        );

        const ids = Array.from(
          new Set<number>(
            (rows ?? [])
              .map((row: any) => Number(row?.id_almacen_ref))
              .filter((id) => Number.isFinite(id) && id > 0),
          ),
        );
        if (ids.length > 0) {
          return ids;
        }
      } catch {
        // fallback HTTP
      }
    }

    return this.findWarehouseIdsByHeadquartersAssignmentApi(headquartersId);
  }

  private getAdminDatabaseName(): string | null {
    const db = String(process.env.ADMIN_DB_DATABASE ?? '').trim();
    return db || null;
  }

  private async findHeadquartersAssignmentByWarehouseApi(
    warehouseId: number,
  ): Promise<string | null> {
    const baseUrls: string[] = [];

    if (process.env.ADMIN_SERVICE_URL) {
      baseUrls.push(String(process.env.ADMIN_SERVICE_URL).replace(/\/$/, ''));
    }
    if (process.env.API_GATEWAY_URL) {
      baseUrls.push(
        `${String(process.env.API_GATEWAY_URL).replace(/\/$/, '')}/admin`,
      );
    }

    baseUrls.push(
      'http://localhost:3002',
      'http://admin_service:3002',
      'http://localhost:3000/admin',
      'http://api-gateway:3000/admin',
    );

    for (const baseUrl of baseUrls) {
      try {
        const response = await axios.get(
          `${baseUrl}/sede-almacen/almacen/${warehouseId}`,
          {
            timeout: 3000,
          },
        );
        const idSede = response?.data?.id_sede;
        if (idSede === undefined || idSede === null) {
          continue;
        }

        const normalized = String(idSede).trim();
        if (normalized) {
          return normalized;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private async findWarehouseIdsByHeadquartersAssignmentApi(
    headquartersId: string,
  ): Promise<number[]> {
    const baseUrls: string[] = [];

    if (process.env.ADMIN_SERVICE_URL) {
      baseUrls.push(String(process.env.ADMIN_SERVICE_URL).replace(/\/$/, ''));
    }
    if (process.env.API_GATEWAY_URL) {
      baseUrls.push(
        `${String(process.env.API_GATEWAY_URL).replace(/\/$/, '')}/admin`,
      );
    }

    baseUrls.push(
      'http://localhost:3002',
      'http://admin_service:3002',
      'http://localhost:3000/admin',
      'http://api-gateway:3000/admin',
    );

    for (const baseUrl of baseUrls) {
      try {
        const response = await axios.get(
          `${baseUrl}/sede-almacen/sede/${headquartersId}`,
          {
            timeout: 3000,
          },
        );

        const rawItems = response?.data?.almacenes;
        if (!Array.isArray(rawItems)) {
          continue;
        }

        const ids = Array.from(
          new Set<number>(
            rawItems
              .map((item: any) => Number(item?.id_almacen))
              .filter((id) => Number.isFinite(id) && id > 0),
          ),
        );
        if (ids.length > 0) {
          return ids;
        }
      } catch {
        continue;
      }
    }

    return [];
  }
}
