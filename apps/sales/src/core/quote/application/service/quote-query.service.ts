import { Injectable, Inject } from '@nestjs/common';
import { IQuoteQueryPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out'; 
import { QuoteResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';

@Injectable()
export class QuoteQueryService implements IQuoteQueryPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
  ) {}

  async getById(id: number): Promise<QuoteResponseDto | null> {
    const quote = await this.repository.findById(id);
    return quote ? QuoteMapper.toResponseDto(quote) : null;
  }

  async getByCustomerDocument(valor_doc: string): Promise<QuoteResponseDto[]> {
    const customer = await this.customerRepository.findByDocument(valor_doc);
    if (!customer) return [];
    const quotes = await this.repository.findByCustomerId(customer.id_cliente);
    return quotes.map(QuoteMapper.toResponseDto);
  }
}