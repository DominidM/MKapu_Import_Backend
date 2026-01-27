

// logistics/src/core/catalog/product/application/dto/in/update-product-prices-dto.ts
export interface UpdateProductPricesDto {
  id_producto: number;
  pre_compra?: number;
  pre_venta?: number;
  pre_unit?: number;
  pre_may?: number;
  pre_caja?: number;
}