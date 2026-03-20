import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Not, Repository } from 'typeorm';
import { IPromotionRepositoryPort } from '../../../../domain/ports/out/promotion-ports-out';
import { PromotionDomainEntity } from '../../../../domain/entity/promotion-domain-entity';
import { PromotionOrmEntity } from '../../../entity/promotion-orm.entity';
import { PromotionMapper } from '../../../../application/mapper/promotion.mapper';
import { PromotionRuleOrmEntity } from '../../../entity/promotion_rule-orm.entity';
import { DiscountAppliedOrmEntity } from '../../../entity/discount_applied-orm.entity';

@Injectable()
export class PromotionRepository implements IPromotionRepositoryPort {
  constructor(
    @InjectRepository(PromotionOrmEntity)
    private readonly repository: Repository<PromotionOrmEntity>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<[PromotionDomainEntity[], number]> {
    const [entities, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['rules', 'discountsApplied'],
    });
    return [PromotionMapper.toDomainList(entities), total];
  }

  async findById(id: number): Promise<PromotionDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { id_promocion: id },
      relations: ['rules', 'discountsApplied'],
    });
    return entity ? PromotionMapper.toDomain(entity) : null;
  }

  async findActive(): Promise<PromotionDomainEntity[]> {
    const entities = await this.repository.find({
      where: { activo: true },
      relations: ['rules', 'discountsApplied'],
    });
    return PromotionMapper.toDomainList(entities);
  }

  async save(promotion: PromotionDomainEntity): Promise<PromotionDomainEntity> {
    const orm = PromotionMapper.toOrm(promotion);
    const saved = await this.repository.save(orm);
    return PromotionMapper.toDomain(saved);
  }

  async update(
    id: number,
    promotion: PromotionDomainEntity,
  ): Promise<PromotionDomainEntity> {
    const updated = await this.repository.manager.transaction(
      async (manager) => {
        const updateResult = await manager.update(
          PromotionOrmEntity,
          { id_promocion: id },
          {
            concepto: promotion.concepto,
            tipo: promotion.tipo,
            valor: promotion.valor,
            activo: promotion.activo,
          },
        );

        if (!updateResult.affected) {
          throw new Error(`Promotion with ID ${id} not found`);
        }

        await this.syncRules(manager, id, promotion.reglas ?? []);
        await this.syncDiscounts(
          manager,
          id,
          promotion.descuentosAplicados ?? [],
        );

        const refreshed = await manager.findOne(PromotionOrmEntity, {
          where: { id_promocion: id },
          relations: ['rules', 'discountsApplied'],
        });

        if (!refreshed) {
          throw new Error(`Promotion with ID ${id} not found after update`);
        }

        return refreshed;
      },
    );

    return PromotionMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete({ id_promocion: id });
  }

  async changeStatus(
    id: number,
    activo: boolean,
  ): Promise<PromotionDomainEntity> {
    await this.repository.update({ id_promocion: id }, { activo });
    const entity = await this.repository.findOne({
      where: { id_promocion: id },
      relations: ['rules', 'discountsApplied'],
    });
    return entity ? PromotionMapper.toDomain(entity) : null;
  }

  private async syncRules(
    manager: EntityManager,
    promotionId: number,
    rules: PromotionDomainEntity['reglas'],
  ): Promise<void> {
    const currentRules = await manager.find(PromotionRuleOrmEntity, {
      where: { id_promocion: promotionId },
    });
    const currentRuleIds = new Set(currentRules.map((rule) => rule.id_regla));

    const rulesToPersist = (rules ?? []).map((rule) =>
      manager.create(PromotionRuleOrmEntity, {
        id_regla:
          typeof rule.idRegla === 'number' && currentRuleIds.has(rule.idRegla)
            ? rule.idRegla
            : undefined,
        id_promocion: promotionId,
        tipo_condicion: rule.tipoCondicion,
        valor_condicion: rule.valorCondicion,
      }),
    );

    const keptRuleIds = rulesToPersist
      .map((rule) => rule.id_regla)
      .filter((ruleId): ruleId is number => typeof ruleId === 'number');

    if (keptRuleIds.length > 0) {
      await manager.delete(PromotionRuleOrmEntity, {
        id_promocion: promotionId,
        id_regla: Not(In(keptRuleIds)),
      });
    } else {
      await manager.delete(PromotionRuleOrmEntity, {
        id_promocion: promotionId,
      });
    }

    if (rulesToPersist.length > 0) {
      await manager.save(PromotionRuleOrmEntity, rulesToPersist);
    }
  }

  private async syncDiscounts(
    manager: EntityManager,
    promotionId: number,
    discounts: PromotionDomainEntity['descuentosAplicados'],
  ): Promise<void> {
    const currentDiscounts = await manager.find(DiscountAppliedOrmEntity, {
      where: { id_promocion: promotionId },
    });
    const currentDiscountIds = new Set(
      currentDiscounts.map((discount) => discount.id_descuento),
    );

    const discountsToPersist = (discounts ?? []).map((discount) =>
      manager.create(DiscountAppliedOrmEntity, {
        id_descuento:
          typeof discount.idDescuento === 'number' &&
          currentDiscountIds.has(discount.idDescuento)
            ? discount.idDescuento
            : undefined,
        id_promocion: promotionId,
        monto: discount.monto,
      }),
    );

    const keptDiscountIds = discountsToPersist
      .map((discount) => discount.id_descuento)
      .filter(
        (discountId): discountId is number => typeof discountId === 'number',
      );

    if (keptDiscountIds.length > 0) {
      await manager.delete(DiscountAppliedOrmEntity, {
        id_promocion: promotionId,
        id_descuento: Not(In(keptDiscountIds)),
      });
    } else {
      await manager.delete(DiscountAppliedOrmEntity, {
        id_promocion: promotionId,
      });
    }

    if (discountsToPersist.length > 0) {
      await manager.save(DiscountAppliedOrmEntity, discountsToPersist);
    }
  }
}
