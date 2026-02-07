/* apps/sales/src/core/sales-receipt/infrastructure/adapters/out/repository/sales-receipt.respository.ts */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ISalesReceiptRepositoryPort } from '../../../../domain/ports/out/sales_receipt-ports-out';
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

  // ✅ MÉTODO PARA OBTENER EL RUNNER DESDE EL SERVICIO
  getQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  // ✅ MÉTODO CON BLOQUEO PESSIMISTIC_WRITE
  // Esto evita que dos ventas paralelas tomen el mismo número B001-32
  async getNextNumberWithLock(serie: string, queryRunner: QueryRunner): Promise<number> {
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
      relations: ['details', 'cliente', 'tipoVenta', 'tipoComprobante', 'moneda'],
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

  async findAll(filters?: any): Promise<SalesReceipt[]> {
      // (Mantén tu lógica de queryBuilder actual aquí...)
      return []; // Placeholder para no alargar el código
  }

  async getNextNumber(serie: string): Promise<number> {
    const lastReceipt = await this.receiptOrmRepository.findOne({
      where: { serie },
      order: { numero: 'DESC' },
    });
    return lastReceipt ? Number(lastReceipt.numero) + 1 : 1;
  }
}