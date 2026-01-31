import { Stock } from '../../domain/entity/stock-domain-intity';
import { StockOrmEntity } from '../../infrastructure/entity/stock-orm-intity';

export class StockMapper {
  static toDomain(e: StockOrmEntity): Stock {
    return new Stock(
      e.id_stock,
      e.id_producto,
      e.id_almacen,
      e.id_sede,
      e.cantidad,
      e.tipo_ubicacion,
      e.estado,
    );
  }

  static toOrm(d: Stock): StockOrmEntity {
    const e = new StockOrmEntity();
    if (d.id) e.id_stock = d.id;
    e.id_producto = d.productId;
    e.id_almacen = d.warehouseId;
    e.id_sede = d.headquartersId;
    e.cantidad = d.quantity;
    e.tipo_ubicacion = d.locationType;
    e.estado = d.status;
    return e;
  }
}
