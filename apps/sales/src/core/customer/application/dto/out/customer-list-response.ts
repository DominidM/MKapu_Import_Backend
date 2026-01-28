
// sales/src/core/customer/application/dto/out/customer-list-response.ts
import { CustomerResponseDto } from './customer-response-dto';

export interface CustomerListResponse {
  customers: CustomerResponseDto[];
  total: number;
}