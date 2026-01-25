export class Stock {
  id?: number;
  productId: number;
  warehouseId: number;
  headquartersId: string;
  quantity: number;
  locationType: string;
  status: string;

  constructor(
    id: number | undefined,
    productId: number,
    warehouseId: number,
    headquartersId: string,
    quantity: number,
    locationType: string,
    status: string,
  ) {
    this.id = id;
    this.productId = productId;
    this.warehouseId = warehouseId;
    this.headquartersId = headquartersId;
    this.quantity = quantity;
    this.locationType = locationType;
    this.status = status;
  }

  // --- EL MÉTODO QUE FALTA ---
  calculateNewQuantity(delta: number): number {
    const newTotal = Number(this.quantity) + delta;
    if (newTotal < 0) {
      throw new Error(
        `El stock no puede ser negativo. Actual: ${this.quantity}, Intento de resta: ${delta}`,
      );
    }
    return newTotal;
  }
}
