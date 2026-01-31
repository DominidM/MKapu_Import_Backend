/* marketing/src/core/promotion/application/service/promotion-command.service.ts */

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPromotionCommandPort } from '../../domain/ports/in/promotion-ports-in';
import { IPromotionRepositoryPort } from '../../domain/ports/out/promotion-ports-out';
import { PromotionMapper } from '../mapper/promotion.mapper';
import { Promotion } from '../../domain/entity/promotion-domain-entity';

@Injectable()
export class PromotionCommandService implements IPromotionCommandPort {
  constructor(
    @Inject('IPromotionRepositoryPort')
    private readonly repository: IPromotionRepositoryPort,
  ) {}

  async registerPromotion(dto: any): Promise<any> {
    const promotion = Promotion.create({
      concepto: dto.concepto,
      tipo: dto.tipo,
      valor: Number(dto.valor),
      activo: dto.activo ?? true,
    });

    const saved = await this.repository.save(promotion);
    return PromotionMapper.toResponseDto(saved);
  }

  async updatePromotion(id: number, dto: any): Promise<any> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    const updated = Promotion.create({
      idPromocion: id,
      concepto: dto.concepto ?? existing.concepto,
      tipo: dto.tipo ?? existing.tipo,
      valor: dto.valor ? Number(dto.valor) : existing.valor,
      activo: dto.activo ?? existing.activo,
    });

    const result = await this.repository.update(id, updated);
    return PromotionMapper.toResponseDto(result);
  }

  async deletePromotion(id: number): Promise<any> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    await this.repository.delete(id);

    return {
      idPromocion: id,
      message: 'Promoción eliminada correctamente',
    };
  }
}