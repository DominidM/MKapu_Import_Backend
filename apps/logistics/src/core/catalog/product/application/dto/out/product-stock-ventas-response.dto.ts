import { ProductStockVentasItemDto } from './product-stock-ventas-item.dto';
import { PaginationDto } from './pagination.dto';

export class ProductStockVentasResponseDto {
  data: ProductStockVentasItemDto[];
  pagination: PaginationDto;
}