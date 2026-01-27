
// logistics/src/core/catalog/product/application/dto/in/register-product-dto.ts
export interface RegisterProductDto {
  id_categoria: number;
  codigo: string;
  anexo: string;
  descripcion: string;
  pre_compra: number;
  pre_venta: number;
  pre_unit: number;
  pre_may: number;
  pre_caja: number;
  uni_med: string;
}