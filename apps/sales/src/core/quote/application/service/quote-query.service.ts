import { Injectable, Inject } from '@nestjs/common';
import { IQuoteQueryPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ISedeProxy } from '../../domain/ports/out/sede-proxy.port';
import { QuoteResponseDto, QuotePagedResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';
import { QuoteQueryFiltersDto } from '../dto/in/quote-query-filters.dto';

@Injectable()
export class QuoteQueryService implements IQuoteQueryPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject('ISedeProxy')
    private readonly sedeProxy: ISedeProxy,
  ) {}

  async getById(id: number): Promise<QuoteResponseDto | null> {
    const quote = await this.repository.findById(id);
    if (!quote) return null;
    const customer = await this.customerRepository.findById(quote.id_cliente);
    const sede = await this.sedeProxy.getSedeById(quote.id_sede);
    return QuoteMapper.toResponseDto(quote, customer, sede);
  }

  async getByCustomerDocument(valor_doc: string): Promise<QuoteResponseDto[]> {
    const customer = await this.customerRepository.findByDocument(valor_doc);
    if (!customer) return [];
    const quotes = await this.repository.findByCustomerId(customer.id_cliente);
    return Promise.all(
      quotes.map(async quote => {
        const sede = await this.sedeProxy.getSedeById(quote.id_sede);
        return QuoteMapper.toResponseDto(quote, customer, sede);
      })
    );
  }

  async findAllPaged(filters: QuoteQueryFiltersDto): Promise<QuotePagedResponseDto> {
    const { data, total } = await this.repository.findAllPaged(filters);
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;

    // Deduplica IDs para minimizar TCP calls
    const sedeIds = [...new Set(data.map(q => q.id_sede))];
    const clienteIds = [...new Set(data.map(q => q.id_cliente))];

    const [sedes, clientes] = await Promise.all([
      Promise.all(sedeIds.map(id => this.sedeProxy.getSedeById(id).then(s => ({ id, data: s })))),
      Promise.all(clienteIds.map(id => this.customerRepository.findById(id).then(c => ({ id, data: c })))),
    ]);

    const sedeMap = new Map(sedes.map(s => [s.id, s.data]));
    const clienteMap = new Map(clientes.map(c => [c.id, c.data]));

    const mapped = data.map(quote => {
      const sede = sedeMap.get(quote.id_sede);
      const cliente = clienteMap.get(quote.id_cliente);
      const cliente_nombre = cliente?.razon_social
        || `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim()
        || quote.id_cliente;

      return QuoteMapper.toListItemDto(quote, sede?.nombre ?? '', cliente_nombre);
    });

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}