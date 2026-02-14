/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* apps/sales/src/core/sales-receipt/infrastructure/adapters/out/repository/sales-receipt.respository.ts */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';

import {
  ISalesReceiptRepositoryPort,
  FindAllPaginatedFilters,
} from '../../../../domain/ports/out/sales_receipt-ports-out';
import { SalesReceipt } from '../../../../domain/entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../entity/sales-receipt-orm.entity';
import { SalesReceiptMapper } from '../../../../application/mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptRepository implements ISalesReceiptRepositoryPort {
  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly receiptOrmRepository: Repository<SalesReceiptOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  getQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
  async getNextNumberWithLock(
    serie: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const lastReceipt = await queryRunner.manager
      .createQueryBuilder(SalesReceiptOrmEntity, 'receipt')
      .where('receipt.serie = :serie', { serie })
      .orderBy('receipt.numero', 'DESC')
      .getOne();

    return lastReceipt ? Number(lastReceipt.numero) + 1 : 1;
  }

  async save(receipt: SalesReceipt): Promise<SalesReceipt> {
    const receiptOrm = SalesReceiptMapper.toOrm(receipt);
    const savedOrm = await this.receiptOrmRepository.save(receiptOrm);
    return this.findById(savedOrm.id_comprobante) as Promise<SalesReceipt>;
  }

  // ... (findById, update, delete, findBySerie, findAll se mantienen igual que tu código)

  async findById(id: number): Promise<SalesReceipt | null> {
    const receiptOrm = await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details',
        'cliente',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
      ],
    });
    return receiptOrm ? SalesReceiptMapper.toDomain(receiptOrm) : null;
  }

  async update(receipt: SalesReceipt): Promise<SalesReceipt> {
    const receiptOrm = SalesReceiptMapper.toOrm(receipt);
    const updated = await this.receiptOrmRepository.save(receiptOrm);
    return SalesReceiptMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.receiptOrmRepository.delete(id);
  }

  async findBySerie(serie: string): Promise<SalesReceipt[]> {
    const receiptsOrm = await this.receiptOrmRepository.find({
      where: { serie },
      relations: ['details'],
      order: { numero: 'DESC' },
    });
    return receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async findAll(
    filters: FindAllPaginatedFilters,
  ): Promise<{ receipts: SalesReceipt[]; total: number }> {
    const query = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.details', 'details')
      .leftJoinAndSelect('receipt.cliente', 'cliente')
      .leftJoinAndSelect('receipt.tipoVenta', 'tipoVenta')
      .leftJoinAndSelect('receipt.tipoComprobante', 'tipoComprobante')
      .leftJoinAndSelect('receipt.moneda', 'moneda');

    if (filters.estado) {
      query.andWhere('receipt.estado = :estado', { estado: filters.estado });
    }

    if (filters.fec_desde) {
      query.andWhere('receipt.fec_emision >= :fec_desde', {
        fec_desde: filters.fec_desde,
      });
    }

    if (filters.fec_hasta) {
      const dateTo = new Date(filters.fec_hasta);
      dateTo.setHours(23, 59, 59, 999);
      query.andWhere('receipt.fec_emision <= :fec_hasta', {
        fec_hasta: dateTo,
      });
    }

    if (filters.id_cliente) {
      query.andWhere('cliente.id_cliente = :id_cliente', {
        id_cliente: filters.id_cliente,
      });
    }

    if (filters.id_tipo_comprobante) {
      // OJO: en tu mapper se ve id_tipo_comprobante, no "id"
      query.andWhere(
        'tipoComprobante.id_tipo_comprobante = :id_tipo_comprobante',
        {
          id_tipo_comprobante: filters.id_tipo_comprobante,
        },
      );
    }

    if (filters.search) {
      query.andWhere(
        '(receipt.serie LIKE :search OR receipt.numero LIKE :search OR cliente.razon_social LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('receipt.fec_emision', 'DESC');

    // Paginación (skip/take)
    query.distinct(true);
    query.skip(filters.skip);
    query.take(filters.take);

    const [receiptsOrm, total] = await query.getManyAndCount();

    return {
      receipts: receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r)),
      total,
    };
  }

  async getNextNumber(serie: string): Promise<number> {
    const lastReceipt = await this.receiptOrmRepository.findOne({
      where: { serie },
      order: { numero: 'DESC' },
    });
    return lastReceipt ? Number(lastReceipt.numero) + 1 : 1;
  }
}
