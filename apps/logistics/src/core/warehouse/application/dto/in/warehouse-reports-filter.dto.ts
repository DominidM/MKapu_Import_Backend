import { IsOptional, IsString } from 'class-validator';

export class WarehouseReportsFilterDto {
  @IsOptional()
  @IsString()
  periodo?: string;

  @IsOptional()
  @IsString()
  anio?: string;

  @IsOptional()
  @IsString()
  sedeId?: string;
}
