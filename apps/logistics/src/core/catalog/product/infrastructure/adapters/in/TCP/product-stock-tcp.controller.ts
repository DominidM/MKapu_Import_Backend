import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductQueryService } from '../../../../application/service/product-query.service';

@Controller()
export class ProductStockTcpController {
  constructor(private readonly queryService: ProductQueryService) {}

  @MessagePattern({ cmd: 'get_product_stock_ventas_item' })
  async getProductStockVentasItem(
    @Payload() payload: { id_producto: number; id_sede: number; id_almacen?: number }
  ) {
    const { id_producto, id_sede, id_almacen } = payload;

    const detailWithStock = await this.queryService.getProductDetailWithStock(
      id_producto,
      id_sede
    );

    if (!detailWithStock || !detailWithStock.stock) {
      return { stock: 0 };
    }

    return {
      stock: detailWithStock.stock.cantidad,
      id_producto,
      id_sede,
      id_almacen: detailWithStock.stock.id_almacen ?? null,
    };
  }
}