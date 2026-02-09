import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetProductStockDetailQueryDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id_sede: number;
}