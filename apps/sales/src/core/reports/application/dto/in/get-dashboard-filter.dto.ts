import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetDashboardFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(['semana', 'mes', 'trimestre', 'anio'])
  periodo?: string = 'anio';

  @IsOptional()
  @IsString()
  id_sede?: string;
}
