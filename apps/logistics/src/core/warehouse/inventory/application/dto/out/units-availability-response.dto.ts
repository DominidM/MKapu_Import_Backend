export class UnitsAvailabilityResponseDto {
  productId: number;
  warehouseId: number;
  totalUnits: number;
  availableUnits: number;
  byStatus: Record<string, number>;
  sampleAvailableSeries?: string[];
}
