import { CreatePromotionDto, UpdatePromotionDto, ChangePromotionStatusDto } from '../../../application/dto/in';
import { PromotionPagedDto, PromotionDto } from '../../../application/dto/out';

export interface IPromotionCommandPort {
  registerPromotion(dto: CreatePromotionDto): Promise<PromotionDto>;
  updatePromotion(id: number, dto: UpdatePromotionDto): Promise<PromotionDto>;
  changeStatus(dto: ChangePromotionStatusDto): Promise<PromotionDto>;
  deletePromotion(id: number): Promise<{ idPromocion: number; message: string }>;
  hardDeletePromotion(id: number): Promise<{ idPromocion: number; message: string }>;
}


export interface IPromotionQueryPort {
  listPromotions(page?: number, limit?: number): Promise<PromotionPagedDto>;
  getPromotionById(id: number): Promise<PromotionDto | null>;
  getActivePromotions(): Promise<PromotionDto[]>;
}