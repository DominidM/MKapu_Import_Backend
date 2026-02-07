import { GetSalesReportDto } from '../../../application/dto/in/get-sales-report.dto';
import { SalesReportRow } from '../../entity/sales-report-row.entity';

export interface IReportsRepositoryPort {
  getSalesDashboard(filters: GetSalesReportDto): Promise<SalesReportRow[]>;
}
