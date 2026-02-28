import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPromotionRepositoryPort } from '../../../../domain/ports/out/promotion-ports-out';
import { PromotionDomainEntity } from '../../../../domain/entity/promotion-domain-entity';
import { PromotionOrmEntity } from '../../../entity/promotion-orm.entity';
import { PromotionMapper } from '../../../../application/mapper/promotion.mapper';

@Injectable()
export class PromotionRepository implements IPromotionRepositoryPort {
  constructor(
    @InjectRepository(PromotionOrmEntity)
    private readonly repository: Repository<PromotionOrmEntity>,
  ) {}

  async findAll(page = 1, limit = 10): Promise<[PromotionDomainEntity[], number]> {
    const [entities, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['rules', 'discountsApplied']
    });
    return [PromotionMapper.toDomainList(entities), total];
  }

  async findById(id: number): Promise<PromotionDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { id_promocion: id },
      relations: ['rules', 'discountsApplied']
    });
    return entity ? PromotionMapper.toDomain(entity) : null;
  }

  async findActive(): Promise<PromotionDomainEntity[]> {
    const entities = await this.repository.find({
      where: { activo: true },
      relations: ['rules', 'discountsApplied']
    });
    return PromotionMapper.toDomainList(entities);
  }

  async save(promotion: PromotionDomainEntity): Promise<PromotionDomainEntity> {
    const orm = PromotionMapper.toOrm(promotion);
    const saved = await this.repository.save(orm);
    return PromotionMapper.toDomain(saved);
  }

  async update(id: number, promotion: PromotionDomainEntity): Promise<PromotionDomainEntity> {
    const orm = PromotionMapper.toOrm(promotion);
    orm.id_promocion = id; 
    const updated = await this.repository.save(orm);
    return PromotionMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete({ id_promocion: id });
  }

  async changeStatus(id: number, activo: boolean): Promise<PromotionDomainEntity> {
    await this.repository.update({ id_promocion: id }, { activo });
    const entity = await this.repository.findOne({ where: { id_promocion: id }, relations: ['rules', 'discountsApplied'] });
    return entity ? PromotionMapper.toDomain(entity) : null;
  }
}