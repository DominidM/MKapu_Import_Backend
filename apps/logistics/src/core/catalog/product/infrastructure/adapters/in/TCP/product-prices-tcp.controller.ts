import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductQueryService } from '../../../../application/service/query/product-query.service';

@Controller()
export class ProductPricesTcpController {
  constructor(private readonly queryService: ProductQueryService) {}

  /**
   * Devuelve los tres tipos de precio de un producto dado su id y sede.
   * cmd: get_product_prices
   */
  @MessagePattern({ cmd: 'get_product_prices' })
  async getProductPrices(
    @Payload() payload: { id_producto: number; id_sede: number },
  ) {
    const { id_producto, id_sede } = payload;

    const detail = await this.queryService.getProductDetailWithStock(
      id_producto,
      id_sede,
    );

    if (!detail?.producto) {
      return null;
    }

    return {
      id_producto,
      precio_unitario: detail.producto.precio_unitario,
      precio_caja: detail.producto.precio_caja,
      precio_mayor: detail.producto.precio_mayor,
    };
  }

  /**
   * Versión batch: recibe un array de { id_producto, id_sede }.
   * cmd: get_products_prices_batch
   */
  @MessagePattern({ cmd: 'get_products_prices_batch' })
  async getProductsPricesBatch(
    @Payload() payload: { items: { id_producto: number; id_sede: number }[] },
  ) {
    const results = await Promise.all(
      payload.items.map(async ({ id_producto, id_sede }) => {
        try {
          const detail = await this.queryService.getProductDetailWithStock(
            id_producto,
            id_sede,
          );
          if (!detail?.producto) return null;
          return {
            id_producto,
            precio_unitario: detail.producto.precio_unitario,
            precio_caja: detail.producto.precio_caja,
            precio_mayor: detail.producto.precio_mayor,
          };
        } catch {
          return null;
        }
      }),
    );

    return results.filter(Boolean);
  }
}