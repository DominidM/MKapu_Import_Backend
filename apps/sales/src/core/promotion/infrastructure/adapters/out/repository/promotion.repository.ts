/* marketing/src/core/promotion/infrastructure/adapters/out/repository/promotion.repository.ts */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPromotionRepositoryPort } from '../../../../domain/ports/out/promotion-ports-out';
import { Promotion } from '../../../../domain/entity/promotion-domain-entity';
import { PromotionOrmEntity } from '../../../entity/promotion-orm.entity';
import { PromotionMapper } from '../../../../application/mapper/promotion.mapper';

@Injectable()
export class PromotionRepository implements IPromotionRepositoryPort {
  constructor(
    @InjectRepository(PromotionOrmEntity)
    private readonly repository: Repository<PromotionOrmEntity>,
  ) {}

  async findAll(): Promise<Promotion[]> {
    const entities = await this.repository.find();
    return PromotionMapper.toDomainList(entities);
  }

  async findById(id: number): Promise<Promotion | null> {
    const entity = await this.repository.findOne({ 
      where: { id_promocion: id } 
    });
    return entity ? PromotionMapper.toDomain(entity) : null;
  }

  async findActive(): Promise<Promotion[]> {
    const entities = await this.repository.find({ 
      where: { activo: true } 
    });
    return PromotionMapper.toDomainList(entities);
  }

  async save(promotion: Promotion): Promise<Promotion> {
    const orm = PromotionMapper.toOrm(promotion);
    const saved = await this.repository.save(orm);
    return PromotionMapper.toDomain(saved);
  }

  async update(id: number, promotion: Promotion): Promise<Promotion> {
    const orm = PromotionMapper.toOrm(promotion);
    orm.id_promocion = id; // Asegurar el ID
    const updated = await this.repository.save(orm);
    return PromotionMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}