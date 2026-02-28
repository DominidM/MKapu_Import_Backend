import { GetSalesReportDto } from '../../../application/dto/in/get-sales-report.dto';
import { SalesReportRow } from '../../entity/sales-report-row.entity';

export interface IReportsRepositoryPort {
  getSalesDashboard(filters: GetSalesReportDto): Promise<SalesReportRow[]>;
  getKpisData(
    startDate: Date,
    endDate: Date,
    id_sede?: string,
  ): Promise<{ totalVentas: number; totalOrdenes: number }>;
  getTotalClientes(startDate: Date, endDate: Date): Promise<number>;
  getSalesChartData(startDate: Date, endDate: Date): Promise<any[]>;
  getTopProductsData(
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<any[]>;
  getTopSellersData(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<any[]>;
  getPaymentMethodsData(startDate: Date, endDate: Date): Promise<any[]>;
  getSalesByDistrictData(
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<any[]>;
  getSalesByCategoryData(
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<any[]>;
  getSalesByHeadquarterData(startDate: Date, endDate: Date): Promise<any[]>;
}
