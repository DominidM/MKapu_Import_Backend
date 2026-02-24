  export class ProductAutocompleteItemDto {
    id_producto: number;
    codigo: string;
    nombre: string;
    stock: number;
  }

  export class ProductAutocompleteResponseDto {
    data: ProductAutocompleteItemDto[]; 
  }