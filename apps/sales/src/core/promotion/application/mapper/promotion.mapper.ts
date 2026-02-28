import { PromotionDomainEntity } from '../../domain/entity/promotion-domain-entity';
import { PromotionRuleDomainEntity } from '../../domain/entity/promotion-rule-domain-entity';
import { DiscountDomainEntity } from '../../../discount/domain/entity/discount-domain-entity';
import { PromotionOrmEntity } from '../../infrastructure/entity/promotion-orm.entity';
import { PromotionDto, PromotionRuleDto, DiscountAppliedDto } from '../../application/dto/out/promotion.dto';
import { PromotionPagedDto } from '../dto/out';

// Mapper for rules
export class PromotionRuleMapper {
  static toDomain(orm: any): PromotionRuleDomainEntity {
    return PromotionRuleDomainEntity.create({
      idRegla: orm.id_regla,
      idPromocion: orm.id_promocion,
      tipoCondicion: orm.tipo_condicion,
      valorCondicion: orm.valor_condicion,
    });
  }

  static toDto(domain: PromotionRuleDomainEntity): PromotionRuleDto {
    return {
      idRegla: domain.idRegla,
      tipoCondicion: domain.tipoCondicion,
      valorCondicion: domain.valorCondicion,
    };
  }

  static toOrm(domain: PromotionRuleDomainEntity): any {
    // Asumiendo que el entity ORM tiene los mismos campos
    return {
      id_regla: domain.idRegla,
      id_promocion: domain.idPromocion,
      tipo_condicion: domain.tipoCondicion,
      valor_condicion: domain.valorCondicion,
    };
  }
}
// Mapper for applied discounts
export class DiscountAppliedMapper {
  static toDto(domain: any): DiscountAppliedDto {
    return {
      idDescuento: domain.idDescuento,
      monto: domain.monto,
    };
  }

  static toOrm(domain: any): any {
    // Si tienes una DiscountDomainEntity, tipa el argumento
    return {
      id_descuento: domain.idDescuento,
      monto: domain.monto,
    };
  }
}

export class PromotionMapper {
  // ORM → Domain entity
  static toDomain(orm: PromotionOrmEntity): PromotionDomainEntity {
    return PromotionDomainEntity.create({
      idPromocion: orm.id_promocion,
      concepto: orm.concepto,
      tipo: orm.tipo,
      valor: Number(orm.valor),
      activo: orm.activo,
      reglas: (orm.rules ?? []).map(PromotionRuleMapper.toDomain),
      descuentosAplicados: (orm.discountsApplied ?? []).map(discount => ({
        idDescuento: discount.id_descuento,
        monto: discount.monto
      })),
    });
  }

  // Domain entity → ORM
  static toOrm(domain: PromotionDomainEntity): PromotionOrmEntity {
    const orm = new PromotionOrmEntity();
    orm.concepto = domain.concepto;
    orm.tipo = domain.tipo;
    orm.valor = domain.valor;
    orm.activo = domain.activo;
    orm.rules = (domain.reglas ?? []).map(PromotionRuleMapper.toOrm);
    orm.discountsApplied = (domain.descuentosAplicados ?? []).map(DiscountAppliedMapper.toOrm);
    return orm;
  }

  // Domain entity → Response DTO
  static toResponseDto(domain: PromotionDomainEntity): PromotionDto {
    return {
      idPromocion: domain.idPromocion,
      concepto: domain.concepto,
      tipo: domain.tipo,
      valor: domain.valor,
      activo: domain.activo,
      reglas: (domain.reglas ?? []).map(PromotionRuleMapper.toDto),
      descuentosAplicados: (domain.descuentosAplicados ?? []).map(DiscountAppliedMapper.toDto),
    };
  }

  static toDomainList(ormList: PromotionOrmEntity[]): PromotionDomainEntity[] {
    return ormList.map((orm) => this.toDomain(orm));
  }

  static toDtoList(domainList: PromotionDomainEntity[]): PromotionDto[] {
    return domainList.map((promotion) => this.toResponseDto(promotion));
  }

  static toPagedDto(
    domains: PromotionDomainEntity[],
    total: number,
    page: number,
    limit: number
  ): PromotionPagedDto {
    return {
      data: domains.map(this.toResponseDto),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}