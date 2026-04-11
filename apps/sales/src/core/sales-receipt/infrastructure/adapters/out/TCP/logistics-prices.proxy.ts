import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

export interface ProductPricesResult {
  id_producto: number;
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
}

@Injectable()
export class LogisticsPricesProxy {
  private readonly logger = new Logger(LogisticsPricesProxy.name);

  constructor(
    @Inject('LOGISTICS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getProductPrices(
    id_producto: number,
    id_sede: number,
  ): Promise<ProductPricesResult | null> {
    try {
      const result = await firstValueFrom(
        this.client
          .send<ProductPricesResult>(
            { cmd: 'get_product_prices' },
            { id_producto, id_sede },
          )
          .pipe(timeout(5000)),
      );
      return result ?? null;
    } catch (error: any) {
      this.logger.warn(
        `⚠️ No se pudo obtener precios del producto ${id_producto}: ${error?.message}`,
      );
      return null;
    }
  }

  async getProductsPricesBatch(
    items: { id_producto: number; id_sede: number }[],
  ): Promise<Map<number, ProductPricesResult>> {
    try {
      const results = await firstValueFrom(
        this.client
          .send<ProductPricesResult[]>(
            { cmd: 'get_products_prices_batch' },
            { items },
          )
          .pipe(timeout(5000)),
      );
      const map = new Map<number, ProductPricesResult>();
      for (const r of results ?? []) {
        map.set(r.id_producto, r);
      }
      return map;
    } catch (error: any) {
      this.logger.warn(
        `⚠️ No se pudo obtener precios batch: ${error?.message}`,
      );
      return new Map();
    }
  }
}