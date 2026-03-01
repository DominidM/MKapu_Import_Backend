import { SalesReportRow } from '../../entity/sales-report-row.entity';
import { GetSalesReportDto } from '../../../application/dto/in/get-sales-report.dto';
import { GetDashboardFilterDto } from '../../../application/dto/in/get-dashboard-filter.dto';

export interface IReportsUseCase {
  generateSalesReport(filters: GetSalesReportDto): Promise<SalesReportRow[]>;
  calculatePercentage(current: number, previous: number): Promise<number>;
  getKpis(filters: GetDashboardFilterDto): Promise<any>;
  getTotalClientes(startDate: Date, endDate: Date): Promise<number>;
  getSalesChart(
    filters: GetDashboardFilterDto,
  ): Promise<{ labels: string[]; values: number[] }>;
  getTopProducts(filters: GetDashboardFilterDto): Promise<any[]>;
  getTopSellers(filters: GetDashboardFilterDto);
  getPaymentMethods(
    filters: GetDashboardFilterDto,
  ): Promise<{ labels: string[]; values: number[] }>;
  getSalesByDistrict(
    filters: GetDashboardFilterDto,
  ): Promise<{ labels: string[]; values: number[] }>;
  getSalesByCategory(
    filters: GetDashboardFilterDto,
  ): Promise<{ labels: string[]; values: number[] }>;
  getSalesByHeadquarters(filters: GetDashboardFilterDto);
  getRecentSales(filters: GetDashboardFilterDto): Promise<any[]>;
}
