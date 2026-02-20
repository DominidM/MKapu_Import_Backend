import { WarehouseResponseDto } from './warehouse-response.dto';

export interface WarehouseListResponse {
  warehouses: WarehouseResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}