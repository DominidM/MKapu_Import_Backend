import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IQuoteCommandPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ISedeProxy } from '../../domain/ports/out/sede-proxy.port';
import { CreateQuoteDto } from '../dto/in/create-quote.dto';
import { QuoteResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';
import { Quote, QuoteStatus } from '../../domain/entity/quote-domain-entity';
import { QuoteDetail } from '../../domain/entity/quote-datail-domain-entity';
import { ProductStockTcpProxy } from '../../infrastructure/adapters/out/TCP/ProductStockTcpProxy';

const ESTADOS_VALIDOS = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];

@Injectable()
export class QuoteCommandService implements IQuoteCommandPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject(ProductStockTcpProxy)
    private readonly productStockProxy: ProductStockTcpProxy,
    @Inject('ISedeProxy')
    private readonly sedeProxy: ISedeProxy,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const customer = await this.customerRepository.findByDocument(dto.documento_cliente);
    if (!customer) throw new NotFoundException(`Cliente ${dto.documento_cliente} no encontrado`);

    const sede = await this.sedeProxy.getSedeById(dto.id_sede);
    if (!sede) throw new NotFoundException(`Sede ${dto.id_sede} no encontrada`);

    for (const det of dto.detalles) {
      const stockInfo = await this.productStockProxy.getProductStockVentasItem(det.id_prod_ref, dto.id_sede);
      if (!stockInfo || stockInfo.stock < det.cantidad) {
        throw new BadRequestException(`Stock insuficiente para producto ${det.cod_prod}`);
      }
    }

    if (dto.subtotal + dto.igv !== dto.total) {
      throw new BadRequestException('subtotal + igv debe ser igual al total');
    }

    const details = dto.detalles.map(det =>
      new QuoteDetail(null, 0, det.id_prod_ref, det.cod_prod, det.descripcion, det.cantidad, det.precio)
    );

    const domain = new Quote(
      null,
      customer.id_cliente,
      dto.id_sede,
      dto.subtotal,
      dto.igv,
      dto.total,
      'PENDIENTE',
      new Date(),
      new Date(dto.fec_venc),
      true,
      details,
    );

    const saved = await this.repository.save(domain);

    this.eventEmitter.emit('quote.created', {
      id_cotizacion: saved.id_cotizacion,
      id_cliente:    saved.id_cliente,
    });

    return QuoteMapper.toResponseDto(saved, customer, sede);
  }

  async approve(id: number): Promise<QuoteResponseDto> {
    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);

    const customer = await this.customerRepository.findById(domain.id_cliente);
    const sede     = await this.sedeProxy.getSedeById(domain.id_sede);

    domain.aprobar();
    const updated = await this.repository.update(domain);

    this.eventEmitter.emit('quote.approved', {
      id_cotizacion: updated.id_cotizacion,
      total:         updated.total,
    });

    return QuoteMapper.toResponseDto(updated, customer, sede);
  }

  // ── Cambiar estado (RECHAZADA | APROBADA | PENDIENTE) ────────────────────
  async changeStatus(id: number, estado: string): Promise<QuoteResponseDto> {
    const estadoUpper = estado?.toUpperCase();

    if (!ESTADOS_VALIDOS.includes(estadoUpper)) {
      throw new BadRequestException(`Estado inválido: ${estado}. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);

    const customer = await this.customerRepository.findById(domain.id_cliente);
    const sede     = await this.sedeProxy.getSedeById(domain.id_sede);

    domain.cambiarEstado(estadoUpper as QuoteStatus);
    const updated = await this.repository.update(domain);

    this.eventEmitter.emit('quote.status_changed', {
      id_cotizacion: updated.id_cotizacion,
      estado:        updated.estado,
    });

    return QuoteMapper.toResponseDto(updated, customer, sede);
  }


  // ── Eliminar permanentemente ──────────────────────────────────────────────
  async delete(id: number): Promise<void> {
    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);
    await this.repository.delete(id);
    this.eventEmitter.emit('quote.deleted', { id_cotizacion: id });
  }
}