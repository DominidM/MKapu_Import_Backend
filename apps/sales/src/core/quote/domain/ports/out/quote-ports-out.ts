import { QuoteQueryFiltersDto } from '../../../application/dto/in/quote-query-filters.dto';
import { Quote } from '../../entity/quote-domain-entity';

export interface IQuoteRepositoryPort {
  save(quote: Quote): Promise<Quote>;
  update(quote: Quote): Promise<Quote>;
  findById(id: number): Promise<Quote | null>;
  findByCustomerId(id_cliente: string): Promise<Quote[]>;
  findAllPaged(filters: QuoteQueryFiltersDto): Promise<{ data: Quote[]; total: number }>;
  delete(id: number): Promise<void>;
}