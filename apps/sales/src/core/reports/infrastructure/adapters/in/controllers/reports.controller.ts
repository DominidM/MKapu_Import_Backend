import { Controller, Get, Query } from '@nestjs/common';
import { IReportsUseCase } from '../../../../domain/ports/in/reports-use-case';
import { GetSalesReportDto } from '../../../../application/dto/in/get-sales-report.dto';
import { Inject } from '@nestjs/common';

@Controller('reports')
export class ReportsController {
  constructor(
    @Inject('ReportsService')
    private readonly reportsService: IReportsUseCase,
  ) {}

  @Get('sales-dashboard')
  async getSalesDashboard(@Query() filters: GetSalesReportDto) {
    return await this.reportsService.generateSalesReport(filters);
  }
}
