/* sales-receipt/domain/ports/out/sales-receipt-ports-out.ts */

import { SalesReceipt } from '../../entity/sales-receipt-domain-entity';

export interface ISalesReceiptRepositoryPort {
  save(receipt: SalesReceipt): Promise<SalesReceipt>;
  update(receipt: SalesReceipt): Promise<SalesReceipt>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<SalesReceipt | null>;
  findBySerie(serie: string): Promise<SalesReceipt[]>;
  findAll(filters?: {
    estado?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
    id_cliente?: string;
    id_tipo_comprobante?: number;
    fec_desde?: Date;
    fec_hasta?: Date;
    search?: string;
  }): Promise<SalesReceipt[]>;
  getNextNumber(serie: string): Promise<number>;
}