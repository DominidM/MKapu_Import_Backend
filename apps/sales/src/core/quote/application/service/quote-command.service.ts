import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IQuoteCommandPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out'; // Usar el PORT, no el Adapter concreto

import { CreateQuoteDto } from '../dto/in/create-quote.dto';
import { QuoteResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';
import { Quote } from '../../domain/entity/quote-domain-entity';
import { QuoteDetail } from '../../domain/entity/quote-datail-domain-entity';

@Injectable()
export class QuoteCommandService implements IQuoteCommandPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,

    @Inject('ICustomerRepositoryPort') // Usa SIEMPRE el port, nunca el adapter concreto
    private readonly customerRepository: ICustomerRepositoryPort,
  ) {}

  async create(dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    // 1. Busca el cliente usando el puerto de cliente y el documento recibido
    const customer = await this.customerRepository.findByDocument(dto.documento_cliente);
    if (!customer) throw new NotFoundException(`Cliente con documento ${dto.documento_cliente} no encontrado`);

    // 2. Mapea los detalles usando tu nuevo DTO validado
    const details = dto.detalles.map(
      det => new QuoteDetail(
        null,             // id_detalle
        0,                // id_cotizacion, se seteará después del guardado
        det.id_prod_ref,
        det.cod_prod,
        det.descripcion,
        det.cantidad,
        det.precio,
      ),
    );

    // 3. Arma la entidad de dominio Quote (nuevo)
    const domain = new Quote(
      null,
      customer.id_cliente,
      dto.subtotal,
      dto.igv,
      dto.total,
      'PENDIENTE',
      new Date(),
      new Date(dto.fec_venc), // <<< aquí haces el cast correcto
      true,
      details,
    );

    // 4. Guarda y responde
    const savedQuote = await this.repository.save(domain);
    return QuoteMapper.toResponseDto(savedQuote);
  }

  async approve(id: number): Promise<QuoteResponseDto> {
    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);

    domain.aprobar();
    const updated = await this.repository.update(domain);
    return QuoteMapper.toResponseDto(updated);
  }
}