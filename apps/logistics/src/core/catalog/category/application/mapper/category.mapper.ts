import { Category } from '../../domain/entity/category-domain-entity';
import { RegisterCategoryDto, UpdateCategoryDto } from '../dto/in';
import {
  CategoryResponseDto,
  CategoryListResponse,
  CategoryDeletedResponseDto,
} from '../dto/out';
import { CategoryOrmEntity } from '../../infrastructure/entity/category-orm.entity';

export class CategoryMapper {
  static toResponseDto(category: Category): CategoryResponseDto {
    return {
      id_categoria: category.id_categoria!,
      nombre: category.nombre,
      descripcion: category.descripcion,
      activo: category.activo!,
    };
  }

  static toListResponse(
    categories: Category[],
    total: number,
    page: number,
    pageSize: number,
  ): CategoryListResponse {
    return {
      categories: categories.map((cat) => this.toResponseDto(cat)),
      total,
      page,
      pageSize,
    };
  }

  static fromRegisterDto(dto: RegisterCategoryDto): Category {
    return Category.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: true,
    });
  }

  static fromUpdateDto(category: Category, dto: UpdateCategoryDto): Category {
    return Category.create({
      id_categoria: category.id_categoria,
      nombre: dto.nombre ?? category.nombre,
      descripcion: dto.descripcion ?? category.descripcion,
      activo: category.activo,
    });
  }

  static withStatus(category: Category, activo: boolean): Category {
    return Category.create({
      id_categoria: category.id_categoria,
      nombre: category.nombre,
      descripcion: category.descripcion,
      activo,
    });
  }

  static toDeletedResponse(id_categoria: number): CategoryDeletedResponseDto {
    return {
      id_categoria,
      message: 'Categoría eliminada exitosamente',
      deletedAt: new Date(),
    };
  }

  static toDomainEntity(categoryOrm: CategoryOrmEntity): Category {
    return Category.create({
      id_categoria: categoryOrm.id_categoria,
      nombre: categoryOrm.nombre,
      descripcion: categoryOrm.descripcion,
      // Fix bit(1) Buffer
      activo: typeof categoryOrm.activo === 'boolean'
        ? categoryOrm.activo
        : (categoryOrm.activo as any)?.data?.[0] === 1,
    });
  }

  static toOrmEntity(category: Category): CategoryOrmEntity {
    const categoryOrm = new CategoryOrmEntity();
    if (category.id_categoria) {
      categoryOrm.id_categoria = category.id_categoria;
    }
    categoryOrm.nombre = category.nombre;
    categoryOrm.descripcion = category.descripcion ?? '';
    categoryOrm.activo = category.activo ?? true;
    return categoryOrm;
  }
}