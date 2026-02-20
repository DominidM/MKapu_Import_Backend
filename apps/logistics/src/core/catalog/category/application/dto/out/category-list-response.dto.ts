export class CategoryResponseDto {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export class CategoryListResponse {
  categories: CategoryResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export class CategoryDeletedResponseDto {
  id_categoria: number;
  message: string;
  deletedAt: Date;
}