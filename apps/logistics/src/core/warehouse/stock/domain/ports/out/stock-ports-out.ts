import { Stock } from '../../entity/stock-domain-intity';

export interface StockPortsOut {
  findByKeyWithLock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
  ): Promise<Stock | null>;

  save(stock: Stock): Promise<void>;
}
