import { IsInt, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class StockMovementDto {
  @IsInt()
  productId: number;

  @IsInt()
  warehouseId: number;

  @IsString()
  @IsNotEmpty()
  headquartersId: string;

  @IsInt()
  quantityDelta: number; // +10 o -3

  @IsIn(['VENTA', 'COMPRA', 'TRANSFERENCIA', 'AJUSTE'])
  reason: 'VENTA' | 'COMPRA' | 'TRANSFERENCIA' | 'AJUSTE';

  referenceId?: number;
}
