/* ============================================
   sales/src/core/customer/application/dto/in/list-customer-filter-dto.ts
   ============================================ */

export interface ListCustomerFilterDto {
  status?: boolean;
  search?: string;
  documentTypeId?: number;
  page?: number; 
  limit?: number; 
}