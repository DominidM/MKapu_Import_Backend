
/* ============================================
   logistics/src/core/catalog/product/domain/ports/out/product-port-out.ts
   ============================================ */

import { Product } from '../../entity/product-domain-entity';

export interface IProductRepositoryPort {
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Product | null>;
  findByCode(codigo: string): Promise<Product | null>;
  findByCategory(id_categoria: number): Promise<Product[]>;
  findAll(filters?: {
    estado?: boolean;
    search?: string;
    id_categoria?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Product[]>;
  existsByCode(codigo: string): Promise<boolean>;
}
