import { Product } from '../../entity/product-domain-entity';
import {
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
} from '../../../application/dto/in';
import { ProductOrmEntity } from '../../../infrastructure/entity/product-orm.entity';
import { StockOrmEntity } from 'apps/logistics/src/core/warehouse/inventory/infrastructure/entity/stock-orm-entity';

export interface IProductRepositoryPort {
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Product | null>;
  findAll(filters?: ListProductFilterDto): Promise<[Product[], number]>;
  findByCode(codigo: string): Promise<Product | null>;
  findByCategory(id_categoria: number): Promise<Product[]>;
  existsByCode(codigo: string): Promise<boolean>;

  // Query para productos con stock por sede
  findProductsStock(
    filters: ListProductStockFilterDto,
    page: number,
    size: number,
  ): Promise<[StockOrmEntity[], number]>;

  autocompleteProducts(dto: ProductAutocompleteQueryDto): Promise<
    Array<{
      id_producto: number;
      codigo: string;
      nombre: string;
      stock: number;
    }>
  >;

  getProductDetailWithStock(
    id_producto: number,
    id_sede: number,
  ): Promise<{
    product: ProductOrmEntity | null;
    stock: StockOrmEntity | null;
  }>;
}
