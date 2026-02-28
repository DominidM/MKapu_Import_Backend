import { CreateQuoteDto } from '../../../application/dto/in/create-quote.dto';
import { QuoteQueryFiltersDto } from '../../../application/dto/in/quote-query-filters.dto';
import { QuoteResponseDto, QuotePagedResponseDto } from '../../../application/dto/out/quote-response.dto';

export interface IQuoteCommandPort {
  create(dto: CreateQuoteDto): Promise<QuoteResponseDto>;
  approve(id: number): Promise<QuoteResponseDto>;
  changeStatus(id: number, estado: string): Promise<QuoteResponseDto>;
  delete(id: number): Promise<void>;
}

export interface IQuoteQueryPort {
  getById(id: number): Promise<QuoteResponseDto | null>;
  getByCustomerDocument(valor_doc: string): Promise<QuoteResponseDto[]>;
  findAllPaged(filters: QuoteQueryFiltersDto): Promise<QuotePagedResponseDto>;
}