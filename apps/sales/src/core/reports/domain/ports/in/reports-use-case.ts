import { SalesReportRow } from '../../entity/sales-report-row.entity';
import { GetSalesReportDto } from '../../../application/dto/in/get-sales-report.dto';

export interface IReportsUseCase {
  generateSalesReport(filters: GetSalesReportDto): Promise<SalesReportRow[]>;
}
