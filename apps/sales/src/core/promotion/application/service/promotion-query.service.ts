/* marketing/src/core/promotion/application/service/promotion-query.service.ts */

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPromotionQueryPort } from '../../domain/ports/in/promotion-ports-in';
import { IPromotionRepositoryPort } from '../../domain/ports/out/promotion-ports-out';
import { Promotion } from '../../domain/entity/promotion-domain-entity';

@Injectable()
export class PromotionQueryService implements IPromotionQueryPort {
  constructor(
    @Inject('IPromotionRepositoryPort')
    private readonly repository: IPromotionRepositoryPort,
  ) {}

  async listPromotions(): Promise<Promotion[]> {
    return await this.repository.findAll();
  }

  async getPromotionById(id: number): Promise<Promotion | null> {
    const promotion = await this.repository.findById(id);
    
    if (!promotion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    return promotion;
  }

  async getActivePromotions(): Promise<Promotion[]> {
    return await this.repository.findActive();
  }
}