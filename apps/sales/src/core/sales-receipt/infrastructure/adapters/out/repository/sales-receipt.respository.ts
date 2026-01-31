/* sales/src/core/sales-receipt/infrastructure/adapters/out/repository/sales-receipt.repository.ts */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ISalesReceiptRepositoryPort } from '../../../../domain/ports/out/sales_receipt-ports-out';
import { SalesReceipt } from '../../../../domain/entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../entity/sales-receipt-orm.entity';
import { SalesReceiptMapper } from '../../../../application/mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptRepository implements ISalesReceiptRepositoryPort {
  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly receiptOrmRepository: Repository<SalesReceiptOrmEntity>,
    private readonly dataSource: DataSource, // Inyectamos dataSource para transacciones
  ) {}

  async save(receipt: SalesReceipt): Promise<SalesReceipt> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const receiptOrm = SalesReceiptMapper.toOrm(receipt);
      
      // El .save() de TypeORM con cascade: true se encarga de los detalles
      const savedOrm = await queryRunner.manager.save(SalesReceiptOrmEntity, receiptOrm);
      
      await queryRunner.commitTransaction();

      // Recuperamos el objeto completo con relaciones para el Mapper
      return this.findById(savedOrm.id_comprobante) as Promise<SalesReceipt>;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(receipt: SalesReceipt): Promise<SalesReceipt> {
    const receiptOrm = SalesReceiptMapper.toOrm(receipt);
    const updated = await this.receiptOrmRepository.save(receiptOrm);
    return SalesReceiptMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.receiptOrmRepository.delete(id);
  }

  async findById(id: number): Promise<SalesReceipt | null> {
    const receiptOrm = await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: ['details', 'cliente', 'tipoVenta', 'tipoComprobante', 'moneda'],
    });
    return receiptOrm ? SalesReceiptMapper.toDomain(receiptOrm) : null;
  }

  async findBySerie(serie: string): Promise<SalesReceipt[]> {
    const receiptsOrm = await this.receiptOrmRepository.find({
      where: { serie },
      relations: ['details'], // Importante cargar detalles si se necesitan
      order: { numero: 'DESC' },
    });
    return receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async findAll(filters?: {
    estado?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
    id_cliente?: string;
    id_tipo_comprobante?: number;
    fec_desde?: Date;
    fec_hasta?: Date;
    search?: string;
  }): Promise<SalesReceipt[]> {
    const queryBuilder = this.receiptOrmRepository.createQueryBuilder('comprobante')
      .leftJoinAndSelect('comprobante.cliente', 'cliente')
      .leftJoinAndSelect('comprobante.details', 'details');

    if (filters?.estado) {
      queryBuilder.andWhere('comprobante.estado = :estado', { estado: filters.estado });
    }

    if (filters?.id_cliente) {
      queryBuilder.andWhere('comprobante.id_cliente = :id_cliente', { id_cliente: filters.id_cliente });
    }

    if (filters?.id_tipo_comprobante) {
      queryBuilder.andWhere('comprobante.id_tipo_comprobante = :id_tipo_comprobante', {
        id_tipo_comprobante: filters.id_tipo_comprobante,
      });
    }

    if (filters?.fec_desde) {
      queryBuilder.andWhere('comprobante.fec_emision >= :fec_desde', { fec_desde: filters.fec_desde });
    }

    if (filters?.fec_hasta) {
      queryBuilder.andWhere('comprobante.fec_emision <= :fec_hasta', { fec_hasta: filters.fec_hasta });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(comprobante.serie LIKE :search OR CAST(comprobante.numero AS CHAR) LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const receiptsOrm = await queryBuilder.orderBy('comprobante.fec_emision', 'DESC').getMany();
    return receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async getNextNumber(serie: string): Promise<number> {
    const lastReceipt = await this.receiptOrmRepository.findOne({
      where: { serie },
      order: { numero: 'DESC' },
    });
    return lastReceipt ? Number(lastReceipt.numero) + 1 : 1;
  }
}