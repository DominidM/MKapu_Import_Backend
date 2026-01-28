
// sales/src/core/customer/application/dto/out/customer-response-dto.ts
export interface CustomerResponseDto {
  id_cliente: string;
  tipo_doc: 'DNI' | 'RUC' | 'PASAPORTE' | 'CE';
  num_doc: string;
  razon_social?: string;
  nombres?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  estado: boolean;
  displayName: string;
  invoiceType: 'BOLETA' | 'FACTURA';
}
