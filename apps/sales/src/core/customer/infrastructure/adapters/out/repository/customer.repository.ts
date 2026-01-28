

/* ============================================
   DEBUG: Add logging to CustomerRepository save method
   sales/src/core/customer/infrastructure/adapters/out/repository/customer.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerRepositoryPort } from '../../../../domain/ports/out/customer-port-out';
import { Customer } from '../../../../domain/entity/customer-domain-entity';
import { CustomerOrmEntity } from '../../../entity/customer-orm.entity';
import { CustomerMapper } from '../../../../application/mapper/customer.mapper';

@Injectable()
export class CustomerRepository implements ICustomerRepositoryPort {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly customerOrmRepository: Repository<CustomerOrmEntity>,
  ) {}

  async save(customer: Customer): Promise<Customer> {
    console.log('🔍 Domain Customer antes de mapear:', customer);
    
    const customerOrm = CustomerMapper.toOrmEntity(customer);
    console.log('🔍 CustomerORM después de mapear:', customerOrm);
    
    const saved = await this.customerOrmRepository.save(customerOrm);
    console.log('🔍 CustomerORM guardado en DB:', saved);
    
    const domainEntity = CustomerMapper.toDomainEntity(saved);
    console.log('🔍 Domain Customer después de guardar:', domainEntity);
    
    return domainEntity;
  }

  async update(customer: Customer): Promise<Customer> {
    const customerOrm = CustomerMapper.toOrmEntity(customer);
    await this.customerOrmRepository.update(customer.id_cliente!, customerOrm);
    const updated = await this.customerOrmRepository.findOne({
      where: { id_cliente: customer.id_cliente },
    });
    return CustomerMapper.toDomainEntity(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.customerOrmRepository.delete(id);
  }

  async findById(id: string): Promise<Customer | null> {
    const customerOrm = await this.customerOrmRepository.findOne({
      where: { id_cliente: id },
    });
    return customerOrm ? CustomerMapper.toDomainEntity(customerOrm) : null;
  }

  async findByDocument(num_doc: string): Promise<Customer | null> {
    const customerOrm = await this.customerOrmRepository.findOne({
      where: { num_doc },
    });
    return customerOrm ? CustomerMapper.toDomainEntity(customerOrm) : null;
  }

  async findAll(filters?: {
    estado?: boolean;
    search?: string;
    tipo_doc?: string;
  }): Promise<Customer[]> {
    const queryBuilder = this.customerOrmRepository.createQueryBuilder('cliente');

    if (filters?.estado !== undefined) {
      queryBuilder.andWhere('cliente.estado = :estado', {
        estado: filters.estado,
      });
    }

    if (filters?.tipo_doc) {
      queryBuilder.andWhere('cliente.tipo_doc = :tipo_doc', {
        tipo_doc: filters.tipo_doc,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(cliente.num_doc LIKE :search OR cliente.razon_social LIKE :search OR cliente.nombres LIKE :search OR cliente.email LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const customersOrm = await queryBuilder.getMany();
    return customersOrm.map((custOrm) => CustomerMapper.toDomainEntity(custOrm));
  }

  async existsByDocument(num_doc: string): Promise<boolean> {
    const count = await this.customerOrmRepository.count({ where: { num_doc } });
    return count > 0;
  }
}
