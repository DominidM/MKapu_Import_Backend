export class ProductDetailCategoryDto {
  id_categoria: number;
  nombre: string;
}

export class ProductDetailUnidadMedidaDto {
  // no hay tabla unidad en ProductOrmEntity, sale de uni_med
  id: number | null; // puedes dejar null si no manejas catálogo de unidades
  nombre: string;
}

export class ProductDetailDto {
  id_producto: number;
  codigo: string;
  nombre: string; // desde product.anexo
  descripcion: string;

  categoria: ProductDetailCategoryDto;

  precio_compra: number;
  precio_unitario: number;
  precio_mayor: number;
  precio_caja: number;

  unidad_medida: ProductDetailUnidadMedidaDto;

  estado: number; // 1/0
  fecha_creacion: string; // ISO
  fecha_edicion: string;  // ISO
}

export class ProductStockDetailDto {
  id_sede: number;
  sede: string; // lo traes por TCP desde Administration
  id_almacen: number | null;
  cantidad: number;
  estado: string; // en tu entity es varchar, lo dejamos string
}

export class ProductDetailWithStockResponseDto {
  producto: ProductDetailDto;
  stock: ProductStockDetailDto;
}