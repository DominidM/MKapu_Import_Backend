import { Product } from '../../entity/product-domain-entity';
import {
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
} from '../../../application/dto/in';
import { StockOrmEntity } from 'apps/logistics/src/core/warehouse/inventory/infrastructure/entity/stock-orm-entity';

/** Fila raw devuelta por autocompleteProductsVentas (una fila por producto×almacén) */
export interface ProductAutocompleteVentasRaw {
  id_producto: number;
  codigo: string;
  nombre: string;
  id_categoria: number;
  familia: string;
  /** Stock del almacén particular de esta fila */
  stock: number;
  /** Stock total sumado de todos los almacenes (campo agregado) */
  stock_total: number;
  id_almacen: number;
  nombre_almacen: string;
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
  cantidad_unidades: number;
}

export interface ProductStockVentasRaw {
  id_producto: number;
  codigo: string;
  nombre: string;
  familia: string;
  id_categoria: number;
  stock: number;
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
}

export interface CategoriaConStockRaw {
  id_categoria: number;
  nombre: string;
  total_productos: number;
}

export interface IProductRepositoryPort {
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Product | null>;
  findAll(filters?: ListProductFilterDto): Promise<[Product[], number]>;
  findByCode(codigo: string): Promise<Product | null>;
  findByCategory(id_categoria: number): Promise<Product[]>;
  existsByCode(codigo: string): Promise<boolean>;
  findProductsStock(
    filters: ListProductStockFilterDto,
    page: number,
    size: number,
  ): Promise<[StockOrmEntity[], number]>;
  getProductDetailWithStock(
    id_producto: number,
    id_sede: number,
  ): Promise<{ product: any | null; stock: any | null }>;
  autocompleteProducts(dto: ProductAutocompleteQueryDto): Promise<
    Array<{
      id_producto: number;
      codigo: string;
      nombre: string;
      stock: number;
    }>
  >;
  autocompleteProductsVentas(
    id_sede: number,
    search?: string,
    id_categoria?: number,
  ): Promise<ProductAutocompleteVentasRaw[]>;
  getProductsStockVentas(
    id_sede: number,
    page: number,
    size: number,
    search?: string,
    id_categoria?: number,
  ): Promise<[ProductStockVentasRaw[], number]>;
  getCategoriaConStock(id_sede: number): Promise<CategoriaConStockRaw[]>;
  searchAutocompleteByCode(codigo: string): Promise<any[]>;
  getProductsWeightsByIds(ids: string[]): Promise<{ id: string; peso: number }[]>;
  getProductsCodigoByIds(ids: number[]): Promise<{ id_producto: number; codigo: string }[]>;
}
