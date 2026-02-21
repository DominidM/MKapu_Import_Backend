/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ISalesReceiptQueryPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { AdminTcpProxy } from '../../infrastructure/adapters/out/TCP/admin-tcp.proxy';
import { ListSalesReceiptFilterDto } from '../dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  CustomerPurchaseHistoryDto,
  SalesReceiptAutocompleteResponseDto, // ✅ NUEVO
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';
import { SalesReceiptOrmEntity } from '../../infrastructure/entity/sales-receipt-orm.entity';

@Injectable()
export class SalesReceiptQueryService implements ISalesReceiptQueryPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    private readonly adminTcpProxy: AdminTcpProxy,
  ) {}
  async findSaleByCorrelativo(correlativo: string): Promise<any> {
    const parts = correlativo.split('-');
    if (parts.length !== 2) {
      throw new BadRequestException(
        'El formato del correlativo debe ser SERIE-NUMERO (Ej: F001-123)',
      );
    }

    const [serie, numeroStr] = parts;
    const numero = parseInt(numeroStr, 10);

    const sale = await this.receiptRepository.findByCorrelativo(serie, numero);

    if (!sale) {
      throw new NotFoundException(
        `No se encontró el comprobante ${correlativo}`,
      );
    }
    return {
      id: sale.id_comprobante,
      id_sede: sale.id_sede_ref,
      id_almacen: (sale as any).id_almacen || 1,
      cliente_direccion:
        (sale as any).direccion_entrega || 'Dirección no especificada',
      cliente_ubigeo: (sale as any).ubigeo_destino || '150101',
      detalles: sale.details.map((d) => ({
        id_producto: d.id_prod_ref,
        cod_prod: d.cod_prod,
        cantidad: d.cantidad,
        peso_unitario: d.id_prod_ref,
      })),
    };
  }

  async verifySaleForRemission(id: number): Promise<any> {
    const sale = await this.receiptRepository.findById(id);
    if (!sale) return null;
    return {
      id: sale.id_comprobante || id,
      detalles: (sale.items || []).map((item) => ({
        cod_prod: item.productId,
        cantidad: item.quantity,
      })),
    };
  }

  async findCustomerByDocument(documentNumber: string): Promise<any> {
    const customer =
      await this.customerRepository.findByDocument(documentNumber);
    if (!customer) {
      throw new NotFoundException(
        `No se encontró ningún cliente con el documento: ${documentNumber}`,
      );
    }
    return customer;
  }

  async listReceipts(
    filters: ListSalesReceiptFilterDto = {},
  ): Promise<SalesReceiptListResponse> {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;

    const { receipts, total } = await this.receiptRepository.findAllWithRelations({
      estado:               filters.status,
      id_cliente:           filters.customerId,
      id_tipo_comprobante:  filters.receiptTypeId,
      fec_desde:            filters.dateFrom,
      fec_hasta:            filters.dateTo,
      search:               filters.search,
      id_sede:              filters.sedeId,
      skip:                 (page - 1) * limit,
      take:                 limit,
    });

    const enrichedReceipts = await this.enrichReceiptsDetailWithTcp(receipts);

    return { receipts: enrichedReceipts, total };
  }

  async listReceiptsSummary(
    filters: ListSalesReceiptFilterDto = {},
  ): Promise<SalesReceiptSummaryListResponse> {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;

    const { receipts, total } = await this.receiptRepository.findAllWithRelations({
      estado:               filters.status,
      id_cliente:           filters.customerId,
      id_tipo_comprobante:  filters.receiptTypeId,
      fec_desde:            filters.dateFrom,
      fec_hasta:            filters.dateTo,
      search:               filters.search,
      id_sede:              filters.sedeId,
      skip:                 (page - 1) * limit,
      take:                 limit,
    });

    const enrichedReceipts = await this.enrichReceiptsSummaryWithTcp(receipts);

    return { receipts: enrichedReceipts, total };
  }

  async getReceiptById(id: number): Promise<SalesReceiptResponseDto | null> {
    const receiptOrm = await this.receiptRepository.findByIdWithRelations(id);

    if (!receiptOrm) return null;

    const dto      = SalesReceiptMapper.ormToResponseDto(receiptOrm);
    const enriched = await this.enrichReceiptDetailWithTcp(dto);

    return enriched;
  }

  async getReceiptWithHistory(id: number): Promise<SalesReceiptWithHistoryDto> {
    const receiptOrm = await this.receiptRepository.findByIdWithFullRelations(id);

    if (!receiptOrm) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado`);
    }

    const receiptDto      = SalesReceiptMapper.ormToResponseDto(receiptOrm);
    const enrichedReceipt = await this.enrichReceiptDetailWithTcp(receiptDto);

    let customerHistory: CustomerPurchaseHistoryDto | undefined;

    if (receiptOrm.cliente?.id_cliente) {
      try {
        const historyData = await this.receiptRepository.findCustomerPurchaseHistory(
          receiptOrm.cliente.id_cliente,
        );

        const historyWithPromedio = {
          customer:   historyData.customer,
          statistics: {
            totalCompras:  historyData.statistics.totalCompras,
            totalEmitidos: historyData.statistics.totalEmitidos,
            totalAnulados: historyData.statistics.totalAnulados,
            montoTotal:    historyData.statistics.montoTotal,
            montoEmitido:  historyData.statistics.montoEmitido,
            promedioCompra:
              historyData.statistics.totalEmitidos > 0
                ? historyData.statistics.montoEmitido / historyData.statistics.totalEmitidos
                : 0,
          },
          recentPurchases: historyData.recentPurchases || [],
        };

        const mappedHistory  = SalesReceiptMapper.toCustomerHistoryDto(historyWithPromedio);
        customerHistory      = await this.enrichCustomerHistoryWithTcp(mappedHistory);
      } catch (error) {
        console.warn(`No se pudo obtener historial del cliente: ${error.message}`);
      }
    }

    return { receipt: enrichedReceipt, customerHistory };
  }

  async getCustomerPurchaseHistory(
    customerId: string,
  ): Promise<CustomerPurchaseHistoryDto> {
    const historyData = await this.receiptRepository.findCustomerPurchaseHistory(customerId);

    const historyWithPromedio = {
      ...historyData,
      statistics: {
        ...historyData.statistics,
        promedioCompra:
          historyData.statistics.totalEmitidos > 0
            ? historyData.statistics.montoEmitido / historyData.statistics.totalEmitidos
            : 0,
      },
    };

    const mappedHistory = SalesReceiptMapper.toCustomerHistoryDto(historyWithPromedio);
    return await this.enrichCustomerHistoryWithTcp(mappedHistory);
  }

  async getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse> {
    const receiptsOrm = await this.receiptRepository.findBySerieWithRelations(serie);
    return {
      receipts: receiptsOrm.map((orm) => SalesReceiptMapper.ormToResponseDto(orm)),
      total:    receiptsOrm.length,
    };
  }

  // ✅ NUEVO: Autocomplete por DNI/RUC o nombre del cliente
  async autocompleteCustomers(
    search: string,
    sedeId?: number,
  ): Promise<SalesReceiptAutocompleteResponseDto[]> {
    return this.receiptRepository.autocompleteCustomers(search, sedeId);
  }

  // ─── HELPERS PRIVADOS TCP ────────────────────────────────────────────────

  private async enrichReceiptsSummaryWithTcp(receipts: SalesReceiptOrmEntity[]) {
    const summaries = receipts.map((orm) => SalesReceiptMapper.ormToSummaryDto(orm));

    const responsableIds = [...new Set(summaries.map((r) => r.idResponsable))].filter(Boolean);
    const sedeIds        = [...new Set(summaries.map((r) => r.idSede))].filter(Boolean);

    const [users, sedes] = await Promise.all([
      Promise.all(responsableIds.map((id) => this.adminTcpProxy.getUserById(id))),
      Promise.all(sedeIds.map((id)        => this.adminTcpProxy.getSedeById(id))),
    ]);

    const userMap = new Map(users.filter((u) => u).map((u) => [u!.id_usuario, u]));
    const sedeMap = new Map(sedes.filter((s) => s).map((s) => [s!.id_sede,   s]));

    return summaries.map((summary) => {
      const user = userMap.get(Number(summary.idResponsable));
      const sede = sedeMap.get(summary.idSede);
      return {
        ...summary,
        responsableNombre: user
          ? `${user.usu_nom} ${user.ape_pat} ${user.ape_mat}`.trim()
          : 'Responsable no encontrado',
        sedeNombre: sede?.nombre || 'Sede no encontrada',
      };
    });
  }

  private async enrichReceiptsDetailWithTcp(receipts: SalesReceiptOrmEntity[]) {
    const dtos = receipts.map((orm) => SalesReceiptMapper.ormToResponseDto(orm));

    const responsableIds = [...new Set(dtos.map((r) => Number(r.responsable.id)))].filter(Boolean);
    const sedeIds        = [...new Set(dtos.map((r) => r.sede.id))].filter(Boolean);

    const [users, sedes] = await Promise.all([
      Promise.all(responsableIds.map((id) => this.adminTcpProxy.getUserById(id))),
      Promise.all(sedeIds.map((id)        => this.adminTcpProxy.getSedeById(id))),
    ]);

    const userMap = new Map(users.filter((u) => u).map((u) => [u!.id_usuario, u]));
    const sedeMap = new Map(sedes.filter((s) => s).map((s) => [s!.id_sede,   s]));

    return dtos.map((dto) => {
      const user = userMap.get(Number(dto.responsable.id));
      const sede = sedeMap.get(dto.sede.id);
      return {
        ...dto,
        responsable: {
          ...dto.responsable,
          nombre:          user?.usu_nom || dto.responsable.nombre,
          apellidoPaterno: user?.ape_pat || dto.responsable.apellidoPaterno,
          apellidoMaterno: user?.ape_mat || dto.responsable.apellidoMaterno,
          nombreCompleto:  user
            ? `${user.usu_nom} ${user.ape_pat} ${user.ape_mat}`.trim()
            : dto.responsable.nombreCompleto,
        },
        sede: {
          ...dto.sede,
          nombre: sede?.nombre || dto.sede.nombre,
        },
      };
    });
  }

  private async enrichReceiptDetailWithTcp(
    dto: SalesReceiptResponseDto,
  ): Promise<SalesReceiptResponseDto> {
    const [user, sede] = await Promise.all([
      this.adminTcpProxy.getUserById(Number(dto.responsable.id)),
      this.adminTcpProxy.getSedeById(dto.sede.id),
    ]);

    return {
      ...dto,
      responsable: {
        ...dto.responsable,
        nombre:          user?.usu_nom || dto.responsable.nombre,
        apellidoPaterno: user?.ape_pat || dto.responsable.apellidoPaterno,
        apellidoMaterno: user?.ape_mat || dto.responsable.apellidoMaterno,
        nombreCompleto:  user
          ? `${user.usu_nom} ${user.ape_pat} ${user.ape_mat}`.trim()
          : dto.responsable.nombreCompleto,
      },
      sede: {
        ...dto.sede,
        nombre: sede?.nombre || dto.sede.nombre,
      },
    };
  }
}
