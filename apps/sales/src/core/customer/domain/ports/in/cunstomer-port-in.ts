/* ============================================
   sales/src/core/customer/domain/ports/in/customer-port-in.ts
   ============================================ */

import {
  RegisterCustomerDto,
  UpdateCustomerDto,
  ChangeCustomerStatusDto,
  ListCustomerFilterDto,
} from '../../../application/dto/in';

import {
  CustomerResponseDto,
  CustomerListResponse,
  CustomerDeletedResponseDto,
} from '../../../application/dto/out';

export interface ICustomerCommandPort {
  registerCustomer(dto: RegisterCustomerDto): Promise<CustomerResponseDto>;
  updateCustomer(dto: UpdateCustomerDto): Promise<CustomerResponseDto>;
  changeCustomerStatus(dto: ChangeCustomerStatusDto): Promise<CustomerResponseDto>;
  deleteCustomer(id: string): Promise<CustomerDeletedResponseDto>;
}

export interface ICustomerQueryPort {
  listCustomers(filters?: ListCustomerFilterDto): Promise<CustomerListResponse>;
  getCustomerById(id: string): Promise<CustomerResponseDto | null>;
  getCustomerByDocument(num_doc: string): Promise<CustomerResponseDto | null>;
}
