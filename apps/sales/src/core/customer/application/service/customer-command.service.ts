
/* ============================================
   sales/src/core/customer/application/service/customer-command.service.ts
   ============================================ */

import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { ICustomerCommandPort } from '../../domain/ports/in/cunstomer-port-in';
import { ICustomerRepositoryPort } from '../../domain/ports/out/customer-port-out';
import {
  RegisterCustomerDto,
  UpdateCustomerDto,
  ChangeCustomerStatusDto,
} from '../dto/in';
import {
  CustomerResponseDto,
  CustomerDeletedResponseDto,
} from '../dto/out';
import { CustomerMapper } from '../mapper/customer.mapper';

@Injectable()
export class CustomerCommandService implements ICustomerCommandPort {
  constructor(
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto): Promise<CustomerResponseDto> {
    // Validar que el documento no exista
    const exists = await this.customerRepository.existsByDocument(dto.num_doc);
    if (exists) {
      throw new ConflictException(
        `Ya existe un cliente con el documento ${dto.num_doc}`,
      );
    }

    // Crear entidad de dominio desde DTO
    const customer = CustomerMapper.fromRegisterDto(dto);

    // Guardar en repositorio
    const savedCustomer = await this.customerRepository.save(customer);

    // Retornar DTO de respuesta
    return CustomerMapper.toResponseDto(savedCustomer);
  }

  async updateCustomer(dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    // Buscar cliente existente
    const existingCustomer = await this.customerRepository.findById(dto.id_cliente);
    if (!existingCustomer) {
      throw new NotFoundException(
        `Cliente con ID ${dto.id_cliente} no encontrado`,
      );
    }

    // Actualizar entidad de dominio
    const updatedCustomer = CustomerMapper.fromUpdateDto(existingCustomer, dto);

    // Guardar cambios
    const savedCustomer = await this.customerRepository.update(updatedCustomer);

    // Retornar DTO de respuesta
    return CustomerMapper.toResponseDto(savedCustomer);
  }

  async changeCustomerStatus(dto: ChangeCustomerStatusDto): Promise<CustomerResponseDto> {
    // Buscar cliente existente
    const existingCustomer = await this.customerRepository.findById(dto.id_cliente);
    if (!existingCustomer) {
      throw new NotFoundException(
        `Cliente con ID ${dto.id_cliente} no encontrado`,
      );
    }

    // Cambiar estado
    const customerWithNewStatus = CustomerMapper.withStatus(
      existingCustomer,
      dto.estado,
    );

    // Guardar cambios
    const savedCustomer = await this.customerRepository.update(customerWithNewStatus);

    // Retornar DTO de respuesta
    return CustomerMapper.toResponseDto(savedCustomer);
  }

  async deleteCustomer(id: string): Promise<CustomerDeletedResponseDto> {
    // Verificar que el cliente existe
    const existingCustomer = await this.customerRepository.findById(id);
    if (!existingCustomer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Eliminar del repositorio
    await this.customerRepository.delete(id);

    // Retornar confirmación
    return CustomerMapper.toDeletedResponse(id);
  }
}
