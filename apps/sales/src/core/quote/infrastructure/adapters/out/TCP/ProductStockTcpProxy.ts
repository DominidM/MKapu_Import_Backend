import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ProductStockTcpProxy {
  constructor(
    @Inject('PRODUCT_STOCK_SERVICE')
    private readonly client: ClientProxy
  ) {}

  async getProductStockVentasItem(
    id_producto: number,
    id_sede: number,
    id_almacen?: number
  ): Promise<{ stock: number; [key: string]: any }> {
    return this.client.send(
      { cmd: 'get_product_stock_ventas_item' },
      { id_producto, id_sede, id_almacen }
    ).toPromise();
  }
}