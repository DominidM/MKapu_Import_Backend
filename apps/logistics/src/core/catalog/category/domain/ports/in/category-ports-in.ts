/* ============================================
   logistics/src/core/catalog/category/domain/ports/in/category-port-in.ts
   ============================================ */

import {
  RegisterCategoryDto,
  UpdateCategoryDto,
  ChangeCategoryStatusDto,
  ListCategoryFilterDto,
} from '../../../application/dto/in';

import {
  CategoryResponseDto,
  CategoryListResponse,
  CategoryDeletedResponseDto,
} from '../../../application/dto/out';

export interface ICategoryCommandPort {
  registerCategory(dto: RegisterCategoryDto): Promise<CategoryResponseDto>;
  updateCategory(dto: UpdateCategoryDto): Promise<CategoryResponseDto>;
  changeCategoryStatus(dto: ChangeCategoryStatusDto): Promise<CategoryResponseDto>;
  deleteCategory(id: number): Promise<CategoryDeletedResponseDto>;
}

export interface ICategoryQueryPort {
  listCategories(filters?: ListCategoryFilterDto): Promise<CategoryListResponse>;
  getCategoryById(id: number): Promise<CategoryResponseDto | null>;
  getCategoryByName(nombre: string): Promise<CategoryResponseDto | null>;
}