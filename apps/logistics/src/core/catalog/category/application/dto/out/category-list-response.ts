import { CategoryResponseDto } from './category-response-dto';

export interface CategoryListResponse {
  categories: CategoryResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}