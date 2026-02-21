// logistics/src/core/procurement/supplier/domain/ports/out/supplier-ports-out.ts

import { Supplier } from '../../entity/supplier-domain-entity';
import { ListSupplierFilterDto } from '../../../application/dto/in';

export interface ISupplierRepositoryPort {
  save(supplier: Supplier): Promise<Supplier>;
  update(supplier: Supplier): Promise<Supplier>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Supplier | null>;
  findByRuc(ruc: string): Promise<Supplier | null>;
  findAll(filters?: ListSupplierFilterDto): Promise<Supplier[]>;
  existsByRuc(ruc: string): Promise<boolean>;
}
