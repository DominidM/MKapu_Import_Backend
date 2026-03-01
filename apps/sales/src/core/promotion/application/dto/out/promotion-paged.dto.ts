import { PromotionDto } from './promotion.dto';

export class PromotionPagedDto {
  data: PromotionDto[]; 
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}