/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query } from '@nestjs/common';
import { IReportsUseCase } from '../../../../domain/ports/in/reports-use-case';
import { GetSalesReportDto } from '../../../../application/dto/in/get-sales-report.dto';
import { Inject } from '@nestjs/common';
import { GetDashboardFilterDto } from 'apps/sales/src/core/reports/application/dto/in/get-dashboard-filter.dto';

@Controller('reports')
export class ReportsController {
  constructor(
    @Inject('IReportsUseCase')
    private readonly reportsUseCase: IReportsUseCase,
  ) {}

  @Get('sales-dashboard')
  async getSalesDashboard(@Query() filters: GetSalesReportDto) {
    return await this.reportsUseCase.generateSalesReport(filters);
  }
  @Get('dashboard/kpis')
  async getKpis(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getKpis(filters);
  }
  @Get('dashboard/sales-chart')
  async getSalesChart(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getSalesChart(filters);
  }
  @Get('dashboard/top-products')
  async getTopProducts(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getTopProducts(filters);
  }
  @Get('dashboard/top-sellers')
  async getTopSellers(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getTopSellers(filters);
  }
  @Get('dashboard/payment-methods')
  async getPaymentMethods(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getPaymentMethods(filters);
  }
  @Get('dashboard/sales-by-district')
  async getSalesByDistrict(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getSalesByDistrict(filters);
  }
  @Get('dashboard/sales-by-category')
  async getSalesByCategory(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getSalesByCategory(filters);
  }
  @Get('dashboard/sales-by-headquarter')
  async getSalesByHeadquarters(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getSalesByHeadquarters(filters);
  }
  @Get('dashboard/recent-sales')
  async getRecentSales(@Query() filters: GetDashboardFilterDto) {
    return await this.reportsUseCase.getRecentSales(filters);
  }
}
