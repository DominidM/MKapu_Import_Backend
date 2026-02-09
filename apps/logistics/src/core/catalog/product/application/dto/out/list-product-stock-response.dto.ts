import { ProductStockItemDto } from './product-stock-item.dto';
import { PaginationDto } from './pagination.dto';

export class ListProductStockResponseDto {
  data: ProductStockItemDto[];
  pagination: PaginationDto;
}