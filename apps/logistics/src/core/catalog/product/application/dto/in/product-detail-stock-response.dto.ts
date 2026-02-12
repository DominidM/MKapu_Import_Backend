export class ProductDetailCategoryDto {
  id_categoria: number;
  nombre: string;
}

export class ProductDetailUnidadMedidaDto {
  id: number;
  nombre: string;
}

export class ProductDetailDto {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion: string;

  categoria: ProductDetailCategoryDto;

  precio_compra: number;
  precio_unitario: number;
  precio_mayor: number;
  precio_caja: number;

  unidad_medida: ProductDetailUnidadMedidaDto;

  estado: number; // 1/0 si así lo manejas (o boolean si lo tienes boolean)
  fecha_creacion: string; // ISO
  fecha_edicion: string;  // ISO
}

export class ProductStockDetailDto {
  id_sede: number;
  sede: string;
  id_almacen: number | null;
  cantidad: number;
  estado: number; // 1/0 o boolean según tu modelo
}

export class ProductDetailWithStockResponseDto {
  producto: ProductDetailDto;
  stock: ProductStockDetailDto;
}