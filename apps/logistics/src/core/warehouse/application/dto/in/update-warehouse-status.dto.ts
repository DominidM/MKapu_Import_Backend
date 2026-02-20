import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateWarehouseStatusDto {
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    if (value === 0 || value === '0' || value === 'false') return false;
    return value;
  })
  activo!: boolean;
}