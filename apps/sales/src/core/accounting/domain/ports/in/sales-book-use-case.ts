import { GetSalesBookDto } from '../../../application/dto/in/get-sales-book.dto';
import { SalesBookResponseDto } from '../../../application/dto/out/sales-book-response.dto';

export interface ISalesBookUseCase {
  generateSalesBookReport(dto: GetSalesBookDto): Promise<SalesBookResponseDto>;
}

export const ISalesBookUseCase = Symbol('ISalesBookUseCase');
