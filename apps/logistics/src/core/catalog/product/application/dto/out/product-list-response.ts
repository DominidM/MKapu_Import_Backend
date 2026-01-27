
// logistics/src/core/catalog/product/application/dto/out/product-list-response.ts
import { ProductResponseDto } from './product-response-dto';

export interface ProductListResponse {
  products: ProductResponseDto[];
  total: number;
}
