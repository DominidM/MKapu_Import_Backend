import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import { UnitStatus } from '../../../domain/entity/unit-domain-entity';
import { TransferStatus } from '../../../../../warehouse/transfer/domain/entity/transfer-domain-entity';

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

  @IsOptional()
  @IsInt()
  transferId?: number;

  @IsOptional()
  @IsEnum(TransferStatus)
  transferStatus?: TransferStatus;
}
