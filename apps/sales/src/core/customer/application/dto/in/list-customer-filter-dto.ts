
// sales/src/core/customer/application/dto/in/list-customer-filter-dto.ts
export interface ListCustomerFilterDto {
  estado?: boolean;
  search?: string;
  tipo_doc?: 'DNI' | 'RUC' | 'PASAPORTE' | 'CE';
}
