/* sales/src/core/sales-receipt/infrastructure/adapters/out/http/logistics-stock.proxy.ts */
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LogisticsStockProxy {
  // URL del microservicio de logística
  private readonly baseUrl = 'http://localhost:3000/logistics/stock';

  async registerMovement(data: {
    productId: number;
    warehouseId: number;
    headquartersId: number;
    quantityDelta: number;
    reason: string;
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/movement`, data);
    } catch (error) {
      // Si falla logística, lanzamos error para no completar la venta sin stock
      throw new Error(`Error en Logística: ${error.response?.data?.message || error.message}`);
    }
  }
}