import { Inject, Injectable } from '@nestjs/common';
import { ISalesBookUseCase } from '../../domain/ports/in/sales-book-use-case';
import { ISalesBookRepositoryPort } from '../../domain/ports/out/sales-book-repository.port';
import { GetSalesBookDto } from '../dto/in/get-sales-book.dto';
import {
  SalesBookResponseDto,
  SalesBookRowDto,
  SalesBookTotalsDto,
} from '../dto/out/sales-book-response.dto';
import { SalesBookRow } from '../../domain/entity/sales-book-row.entity';

@Injectable()
export class SalesBookService implements ISalesBookUseCase {
  constructor(
    @Inject(ISalesBookRepositoryPort)
    private readonly salesBookRepository: ISalesBookRepositoryPort,
  ) {}

  async generateSalesBookReport(
    dto: GetSalesBookDto,
  ): Promise<SalesBookResponseDto> {
    const rows: SalesBookRow[] =
      await this.salesBookRepository.getSalesBookEntries(dto.year, dto.month);

    let totalBase = 0;
    let totalIgv = 0;
    let totalRevenue = 0;

    const mappedRows: SalesBookRowDto[] = rows.map((row) => {
      if (row.isValidForAccounting) {
        totalBase += row.baseAmount;
        totalIgv += row.igvAmount;
        totalRevenue += row.totalAmount;
      }

      const rowDto = new SalesBookRowDto();
      rowDto.issueDate = row.issueDate.toISOString().split('T')[0];
      rowDto.receiptType = row.receiptTypeSunatCode;
      rowDto.series = row.series;
      rowDto.number = row.number;
      rowDto.fullSeriesNumber = `${row.series}-${String(row.number).padStart(8, '0')}`;

      rowDto.customerDocType = row.customerIdentityType;
      rowDto.customerDocNumber = row.customerIdentityNumber;
      rowDto.customerName = row.customerName;
      rowDto.currency = row.currencyCode;
      rowDto.base = Number(row.baseAmount.toFixed(2));
      rowDto.igv = Number(row.igvAmount.toFixed(2));
      rowDto.total = Number(row.totalAmount.toFixed(2));
      rowDto.status = row.status;
      rowDto.sunatStatus = row.electronicStatus || 'PENDIENTE';

      return rowDto;
    });

    const totalsDto = new SalesBookTotalsDto();
    totalsDto.totalBase = Number(totalBase.toFixed(2));
    totalsDto.totalIgv = Number(totalIgv.toFixed(2));
    totalsDto.totalRevenue = Number(totalRevenue.toFixed(2));
    totalsDto.count = rows.length;

    const response = new SalesBookResponseDto();
    response.period = `${dto.year}-${String(dto.month).padStart(2, '0')}`;
    response.summary = totalsDto;
    response.records = mappedRows;

    return response;
  }
}
