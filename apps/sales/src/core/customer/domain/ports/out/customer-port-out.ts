
/* ============================================
   sales/src/core/customer/domain/ports/out/customer-port-out.ts
   ============================================ */

import { Customer } from '../../entity/customer-domain-entity';

export interface ICustomerRepositoryPort {
  save(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Customer | null>;
  findByDocument(num_doc: string): Promise<Customer | null>;
  findAll(filters?: {
    estado?: boolean;
    search?: string;
    tipo_doc?: string;
  }): Promise<Customer[]>;
  existsByDocument(num_doc: string): Promise<boolean>;
}