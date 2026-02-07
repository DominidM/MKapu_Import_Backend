import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetSalesReportDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  sedeId?: string;

  @IsOptional()
  @IsString()
  vendedorId?: string;
}
