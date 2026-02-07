import { IsInt, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetSalesBookDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(2023)
  year: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
