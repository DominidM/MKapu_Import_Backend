

/* ============================================
   logistics/src/core/catalog/product/domain/ports/in/product-port-in.ts
   ============================================ */

import {
  RegisterProductDto,
  UpdateProductDto,
  UpdateProductPricesDto,
  ChangeProductStatusDto,
  ListProductFilterDto,
} from '../../../application/dto/in';

import {
  ProductResponseDto,
  ProductListResponse,
  ProductDeletedResponseDto,
} from '../../../application/dto/out';

export interface IProductCommandPort {
  registerProduct(dto: RegisterProductDto): Promise<ProductResponseDto>;
  updateProduct(dto: UpdateProductDto): Promise<ProductResponseDto>;
  updateProductPrices(dto: UpdateProductPricesDto): Promise<ProductResponseDto>;
  changeProductStatus(dto: ChangeProductStatusDto): Promise<ProductResponseDto>;
  deleteProduct(id: number): Promise<ProductDeletedResponseDto>;
}

export interface IProductQueryPort {
  listProducts(filters?: ListProductFilterDto): Promise<ProductListResponse>;
  getProductById(id: number): Promise<ProductResponseDto | null>;
  getProductByCode(codigo: string): Promise<ProductResponseDto | null>;
  getProductsByCategory(id_categoria: number): Promise<ProductListResponse>;
}