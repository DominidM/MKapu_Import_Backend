
// sales/src/core/customer/application/dto/in/update-customer-dto.ts
export interface UpdateCustomerDto {
  id_cliente: string;
  razon_social?: string;
  nombres?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
}