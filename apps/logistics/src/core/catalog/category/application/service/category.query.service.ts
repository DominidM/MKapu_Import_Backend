import { Inject, Injectable } from '@nestjs/common';
import { ICategoryQueryPort } from '../../domain/ports/in/category-ports-in';
import { ICategoryRepositoryPort } from '../../domain/ports/out/category-ports-out';
import { ListCategoryFilterDto } from '../dto/in';
import { CategoryResponseDto, CategoryListResponse } from '../dto/out';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class CategoryQueryService implements ICategoryQueryPort {
  constructor(
    @Inject('ICategoryRepositoryPort')
    private readonly repository: ICategoryRepositoryPort,
  ) {}

  async listCategories(filters?: ListCategoryFilterDto): Promise<CategoryListResponse> {
    const { categories, total, page, pageSize } = await this.repository.findAll(filters);
    return CategoryMapper.toListResponse(categories, total, page, pageSize);
  }

  async getCategoryById(id: number): Promise<CategoryResponseDto | null> {
    const category = await this.repository.findById(id);
    if (!category) {
      return null;
    }
    return CategoryMapper.toResponseDto(category);
  }

  async getCategoryByName(nombre: string): Promise<CategoryResponseDto | null> {
    const category = await this.repository.findByName(nombre);
    if (!category) {
      return null;
    }
    return CategoryMapper.toResponseDto(category);
  }
}