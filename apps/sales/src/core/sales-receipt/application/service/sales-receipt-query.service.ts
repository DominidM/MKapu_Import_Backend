/* sales/src/core/sales-receipt/application/service/sales-receipt-query.service.ts */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISalesReceiptQueryPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
// Puerto para la búsqueda del cajero
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ListSalesReceiptFilterDto } from '../dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptQueryService implements ISalesReceiptQueryPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
  ) {}

  /**
   * Implementación del buscador por DNI/RUC para el módulo de Ventas.
   * Resuelve el rombo de "¿Existe el cliente?" en tu diagrama.
   */
  async findCustomerByDocument(documentNumber: string): Promise<any> {
    const customer = await this.customerRepository.findByDocument(documentNumber);
    
    if (!customer) {
      // Lanzamos error para que el frontend capture el 404 y sugiera registrar al cliente
      throw new NotFoundException(`No se encontró ningún cliente con el documento: ${documentNumber}`);
    }
    
    // Retornamos el dominio del cliente (incluye el UUID necesario para la venta)
    return customer;
  }

  async listReceipts(filters?: ListSalesReceiptFilterDto): Promise<SalesReceiptListResponse> {
    const repoFilters = filters
      ? {
          estado: filters.status,
          id_cliente: filters.customerId,
          id_tipo_comprobante: filters.receiptTypeId,
          fec_desde: filters.dateFrom,
          fec_hasta: filters.dateTo,
          search: filters.search,
        }
      : undefined;

    const receipts = await this.receiptRepository.findAll(repoFilters);

    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }

  async getReceiptById(id: number): Promise<SalesReceiptResponseDto | null> {
    const receipt = await this.receiptRepository.findById(id);
    return receipt ? SalesReceiptMapper.toResponseDto(receipt) : null;
  }

  async getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse> {
    const receipts = await this.receiptRepository.findBySerie(serie);
    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }
}