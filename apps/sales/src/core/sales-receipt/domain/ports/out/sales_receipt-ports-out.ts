import { QueryRunner } from 'typeorm'; // Importante para la transacción
import { SalesReceipt } from '../../entity/sales-receipt-domain-entity';

export interface ISalesReceiptRepositoryPort {
  save(receipt: SalesReceipt): Promise<SalesReceipt>;
  update(receipt: SalesReceipt): Promise<SalesReceipt>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<SalesReceipt | null>;
  findBySerie(serie: string): Promise<SalesReceipt[]>;
  findAll(filters: FindAllPaginatedFilters): Promise<{ receipts: SalesReceipt[]; total: number }>;
  getNextNumber(serie: string): Promise<number>;

  // ✅ NUEVOS MÉTODOS PARA TRANSACCIONES Y BLOQUEO
  getQueryRunner(): QueryRunner;
  getNextNumberWithLock(
    serie: string,
    queryRunner: QueryRunner,
  ): Promise<number>;
}


export type FindAllPaginatedFilters = {
  estado?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
  id_cliente?: string;
  id_tipo_comprobante?: number;
  fec_desde?: Date;
  fec_hasta?: Date;
  search?: string;
  skip: number;
  take: number;
};
