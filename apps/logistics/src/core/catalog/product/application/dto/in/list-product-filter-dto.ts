// logistics/src/core/catalog/product/application/dto/in/list-product-filter-dto.ts

export interface ListProductFilterDto {
  estado?: boolean;
  search?: string;
  id_categoria?: number;
  minPrice?: number;
  maxPrice?: number;
}