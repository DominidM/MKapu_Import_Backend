import { Inject, Injectable } from '@nestjs/common';
import { IReportsUseCase } from '../../domain/ports/in/reports-use-case';
import { SalesReportRow } from '../../domain/entity/sales-report-row.entity';
import { GetSalesReportDto } from '../dto/in/get-sales-report.dto';
import { IReportsRepositoryPort } from '../../domain/ports/out/reports-repository.port';

@Injectable()
export class ReportsService implements IReportsUseCase {
  constructor(
    @Inject('IReportsRepositoryPort')
    private readonly reportsRepository: IReportsRepositoryPort,
  ) {}
  async generateSalesReport(
    filters: GetSalesReportDto,
  ): Promise<SalesReportRow[]> {
    return await this.reportsRepository.getSalesDashboard(filters);
  }
}
