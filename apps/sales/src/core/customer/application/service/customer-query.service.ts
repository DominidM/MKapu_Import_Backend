
/* ============================================
   sales/src/core/customer/application/service/customer-query.service.ts
   ============================================ */

import { Injectable, Inject } from '@nestjs/common';
import { ICustomerQueryPort } from '../../domain/ports/in/cunstomer-port-in';
import { ICustomerRepositoryPort } from '../../domain/ports/out/customer-port-out';
import { ListCustomerFilterDto } from '../dto/in';
import {
  CustomerResponseDto,
  CustomerListResponse,
} from '../dto/out';
import { CustomerMapper } from '../mapper/customer.mapper';

@Injectable()
export class CustomerQueryService implements ICustomerQueryPort {
  constructor(
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
  ) {}

  async listCustomers(filters?: ListCustomerFilterDto): Promise<CustomerListResponse> {
    // Construir filtros para el repositorio
    const repoFilters = filters
      ? {
          estado: filters.estado,
          search: filters.search,
          tipo_doc: filters.tipo_doc,
        }
      : undefined;

    // Obtener lista de clientes
    const customers = await this.customerRepository.findAll(repoFilters);

    // Retornar respuesta formateada
    return CustomerMapper.toListResponse(customers);
  }

  async getCustomerById(id: string): Promise<CustomerResponseDto | null> {
    // Buscar cliente por ID
    const customer = await this.customerRepository.findById(id);

    // Retornar null si no existe, o el DTO si existe
    return customer ? CustomerMapper.toResponseDto(customer) : null;
  }

  async getCustomerByDocument(num_doc: string): Promise<CustomerResponseDto | null> {
    // Buscar cliente por documento
    const customer = await this.customerRepository.findByDocument(num_doc);

    // Retornar null si no existe, o el DTO si existe
    return customer ? CustomerMapper.toResponseDto(customer) : null;
  }
}