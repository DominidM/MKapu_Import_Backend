/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { TransferPortsOut } from '../../../../domain/ports/out/transfer-ports-out';
import {
  Transfer,
  TransferStatus,
} from '../../../../domain/entity/transfer-domain-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransferDetailOrmEntity } from '../../../entity/transfer-detail-orm.entity';
import { TransferOrmEntity } from '../../../entity/transfer-orm.entity';
import { TransferMapper } from '../../../../application/mapper/transfer-mapper';

@Injectable()
export class TransferRepository implements TransferPortsOut {
  constructor(
    @InjectRepository(TransferOrmEntity)
    private readonly transferRepo: Repository<TransferOrmEntity>,
    @InjectRepository(TransferDetailOrmEntity)
    private readonly detailRepo: Repository<TransferDetailOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}
  async save(transfer: Transfer): Promise<Transfer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entity = this.transferRepo.create({
        id: transfer.id,
        originWarehouseId: transfer.originWarehouseId,
        destinationWarehouseId: transfer.destinationWarehouseId,
        date: transfer.requestDate,
        status: transfer.status,
        motive: transfer.observation,
        operationType: 'TRANSFERENCIA',
      });
      const savedEntity = await queryRunner.manager.save(entity);
      if (!transfer.id) {
        const detailEntities: TransferDetailOrmEntity[] = [];

        for (const item of transfer.items) {
          for (const serie of item.series) {
            const detail = this.detailRepo.create({
              transferId: savedEntity.id,
              productId: item.productId,
              serialNumber: serie,
              quantity: 1,
            });
            detailEntities.push(detail);
          }
        }
        await queryRunner.manager.save(detailEntities);
      }
      await queryRunner.commitTransaction();
      transfer.id = savedEntity.id;
      return transfer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findById(id: number): Promise<Transfer | null> {
    const entity = await this.transferRepo.findOne({where: {id}, relations:['details']});
    if (!entity) return null;
    return TransferMapper.mapToDomain(entity);
  }
  async updateStatus(
    id: number,
    status: TransferStatus,
    responseDate?: Date,
    completionDate?: Date,
  ): Promise<void> {
    //Transferencia no tiene id_sede xd
    await this.transferRepo.update(id, { status });
  }
  async findByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    const entities = await this.transferRepo.find({
      relations: ['details'],
      order: { date: 'DESC' },
    });
    return entities.map(e => TransferMapper.mapToDomain(e));
  }
}
