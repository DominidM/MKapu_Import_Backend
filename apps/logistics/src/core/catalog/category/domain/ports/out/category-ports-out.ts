import { Category } from '../../entity/category-domain-entity';

export interface CategoryFindAllFilters {
  activo?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CategoryFindAllResult {
  categories: Category[];
  total: number;
}

export interface ICategoryRepositoryPort {
  save(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Category | null>;
  findByName(nombre: string): Promise<Category | null>;
  findAll(filters?: CategoryFindAllFilters): Promise<CategoryFindAllResult>;
  existsByName(nombre: string): Promise<boolean>;
}