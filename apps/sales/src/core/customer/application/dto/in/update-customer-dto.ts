
/* ============================================
   sales/src/core/customer/application/dto/in/update-customer-dto.ts
   ============================================ */

export interface UpdateCustomerDto {
  customerId: string;
  documentTypeId?: number; 
  documentValue?: string;
  name?: string;
  lastName?: string;
  businessName?: string;
  address?: string;
  email?: string;
  phone?: string;
}