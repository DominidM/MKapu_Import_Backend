/* eslint-disable prettier/prettier */
import { Stock } from '../../entity/stock-domain-intity';

export interface StockPortsOut {
  findStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
  ): Promise<Stock | null>;

  updateQuantity(stockId: number, newQuantity: number): Promise<void>;

  create(stock: Stock): Promise<Stock>;
  updateStock(productId: number, warehouseId: number, headquartersId: string, quantity: number): Promise<void>;
}
