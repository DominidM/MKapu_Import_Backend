import { SalesBookRow } from '../../entity/sales-book-row.entity';

export interface ISalesBookRepositoryPort {
  getSalesBookEntries(year: number, month: number): Promise<SalesBookRow[]>;
}

export const ISalesBookRepositoryPort = Symbol('ISalesBookRepositoryPort');
