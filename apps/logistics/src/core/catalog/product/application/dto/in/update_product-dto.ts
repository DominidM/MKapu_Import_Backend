
// logistics/src/core/catalog/product/application/dto/in/update-product-dto.ts
export interface UpdateProductDto {
  id_producto: number;
  id_categoria?: number;
  codigo?: string;
  anexo?: string;
  descripcion?: string;
  uni_med?: string;
}
