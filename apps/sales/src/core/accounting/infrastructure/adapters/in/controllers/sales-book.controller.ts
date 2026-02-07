import { Controller, Get, Query, Inject, ValidationPipe } from '@nestjs/common';
import { ISalesBookUseCase } from '../../../../domain/ports/in/sales-book-use-case';
import { GetSalesBookDto } from '../../../../application/dto/in/get-sales-book.dto';
import { SalesBookResponseDto } from '../../../../application/dto/out/sales-book-response.dto';

@Controller('accounting/sales-book')
export class SalesBookController {
  constructor(
    @Inject(ISalesBookUseCase)
    private readonly salesBookUseCase: ISalesBookUseCase,
  ) {}

  @Get()
  async getSalesBook(
    @Query(new ValidationPipe({ transform: true })) query: GetSalesBookDto,
  ): Promise<SalesBookResponseDto> {
    return this.salesBookUseCase.generateSalesBookReport(query);
  }
}
