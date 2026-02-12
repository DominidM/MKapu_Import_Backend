import { IsArray, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UnitStatus } from '../../../domain/entity/unit-domain-entity';

export interface UpdateUnitDto {
  warehouseId?: number;
  status?: UnitStatus;
  expirationDate?: Date;
}
export class ChangeUnitStatusDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  series: string[];

  @IsEnum(UnitStatus)
  @IsNotEmpty()
  targetStatus: UnitStatus;
}
