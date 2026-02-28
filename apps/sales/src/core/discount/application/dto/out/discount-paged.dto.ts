import { DiscountDto } from "./discount.dto";

export class DiscountPagedDto {
  data: DiscountDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}