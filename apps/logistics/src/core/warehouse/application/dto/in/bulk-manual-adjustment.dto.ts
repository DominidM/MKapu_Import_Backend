import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ManualAdjustmentItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  warehouseId: number;

  @IsNumber()
  @IsNotEmpty()
  idSede: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class BulkManualAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualAdjustmentItemDto)
  items: ManualAdjustmentItemDto[];
}
