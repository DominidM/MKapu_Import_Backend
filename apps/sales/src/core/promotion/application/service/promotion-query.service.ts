import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPromotionQueryPort } from '../../domain/ports/in/promotion-ports-in';
import { IPromotionRepositoryPort } from '../../domain/ports/out/promotion-ports-out';
import { PromotionMapper } from '../mapper/promotion.mapper';
import { PromotionDto, PromotionPagedDto } from '../dto/out';

@Injectable()
export class PromotionQueryService implements IPromotionQueryPort {
  constructor(
    @Inject('IPromotionRepositoryPort')
    private readonly repository: IPromotionRepositoryPort,
  ) {}

  async listPromotions(page = 1, limit = 10): Promise<PromotionPagedDto> {
    const [promotions, total] = await this.repository.findAll(page, limit);
    return PromotionMapper.toPagedDto(promotions, total, page, limit);
  }

  async getPromotionById(id: number): Promise<PromotionDto | null> {
    const promotion = await this.repository.findById(id);
    if (!promotion) throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    return PromotionMapper.toResponseDto(promotion);
  }

  async getActivePromotions(): Promise<PromotionDto[]> {
    const promotions = await this.repository.findActive();
    return PromotionMapper.toDtoList(promotions);
  }
}