

/* ============================================
   APPLICATION LAYER - QUERY SERVICE
   logistics/src/core/catalog/product/application/service/product-query.service.ts
   ============================================ */

import { Inject, Injectable } from '@nestjs/common';
import { IProductQueryPort } from '../../domain/ports/in/product-port-in';
import { IProductRepositoryPort } from '../../domain/ports/out/product-ports-out';
import { ListProductFilterDto } from '../dto/in';
import { ProductResponseDto, ProductListResponse } from '../dto/out';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class ProductQueryService implements IProductQueryPort {
  constructor(
    @Inject('IProductRepositoryPort')
    private readonly repository: IProductRepositoryPort,
  ) {}

  async listProducts(filters?: ListProductFilterDto): Promise<ProductListResponse> {
    const products = await this.repository.findAll(filters);
    return ProductMapper.toListResponse(products);
  }

  async getProductById(id: number): Promise<ProductResponseDto | null> {
    const product = await this.repository.findById(id);
    if (!product) {
      return null;
    }
    return ProductMapper.toResponseDto(product);
  }

  async getProductByCode(codigo: string): Promise<ProductResponseDto | null> {
    const product = await this.repository.findByCode(codigo);
    if (!product) {
      return null;
    }
    return ProductMapper.toResponseDto(product);
  }

  async getProductsByCategory(id_categoria: number): Promise<ProductListResponse> {
    const products = await this.repository.findByCategory(id_categoria);
    return ProductMapper.toListResponse(products);
  }
}