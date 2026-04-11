export class ProductStockItemDto {
  id_producto: number;
  codigo: string;
  nombre: string;
  familia: string;
  sede: string;
  stock: number;

  tiene_mermas?: boolean;
  tiene_remates?: boolean;
}
