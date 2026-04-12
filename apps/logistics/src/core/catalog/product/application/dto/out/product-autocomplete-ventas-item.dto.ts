export interface StockPorAlmacenDto {
  id_almacen: number;
  nombre_almacen: string;
  stock: number;
}

export interface ProductAutocompleteVentasItemDto {
  id_producto: number;
  codigo: string;
  nombre: string;
  id_categoria: number;
  familia: string;
  /** Stock total sumado de todos los almacenes de la sede */
  stock: number;
  /** Desglose de stock por cada almacén de la sede */
  stockPorAlmacen: StockPorAlmacenDto[];
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
}
