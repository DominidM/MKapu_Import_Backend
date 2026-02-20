/* ============================================
   logistics/src/core/catalog/category/application/dto/out/category-list-response.ts
   ============================================ */

import { CategoryResponseDto } from './category-response-dto';

export class CategoryListResponse {
  categories: CategoryResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}