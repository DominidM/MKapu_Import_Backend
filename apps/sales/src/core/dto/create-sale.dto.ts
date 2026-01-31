export class CreateSaleItemDto {
  productId: number;
  quantity: number;
  price: number;
}

export class CreateSaleDto {
  customerId: number;
  items: {
    price: any;
    productId: number;
    quantity: number;
    warehouseId: number;
    headquartersId: string;
  }[];
}

