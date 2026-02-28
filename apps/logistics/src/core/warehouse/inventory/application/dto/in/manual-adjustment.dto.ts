// apps/logistics/src/core/warehouse/inventory/application/dto/in/manual-adjustment.dto.ts
import { IsNumber, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ManualAdjustmentDto {
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

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
