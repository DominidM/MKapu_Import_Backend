// sales/src/core/customer/application/dto/in/register-customer-dto.ts
export interface RegisterCustomerDto {
  tipo_doc: 'DNI' | 'RUC' | 'PASAPORTE' | 'CE';
  num_doc: string;
  razon_social?: string;
  nombres?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
}