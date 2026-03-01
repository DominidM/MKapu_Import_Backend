import { IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetProductStockDetailQueryDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id_sede: number;

  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  id_almacen?: number;
}
