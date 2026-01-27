
// logistics/src/core/catalog/product/application/dto/out/product-response-dto.ts
export interface ProductResponseDto {
  id_producto: number;
  id_categoria: number;
  categoriaNombre?: string;
  codigo: string;
  anexo: string;
  descripcion: string;
  pre_compra: number;
  pre_venta: number;
  pre_unit: number;
  pre_may: number;
  pre_caja: number;
  uni_med: string;
  estado: boolean;
  fec_creacion: Date;
  fec_actual: Date;
  profitMargin?: number;
}
