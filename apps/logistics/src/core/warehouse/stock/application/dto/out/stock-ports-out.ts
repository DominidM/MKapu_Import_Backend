import { Stock } from '../../../domain/entity/stock-domain-intity';

export interface StockPortsOut {
  findStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
  ): Promise<Stock | null>;

  save(stock: Stock): Promise<void>;
}
