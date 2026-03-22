import { PromotionDomainEntity } from '../../domain/entity/promotion-domain-entity';
import { PromotionRuleDomainEntity } from '../../domain/entity/promotion-rule-domain-entity';
import { PromotionOrmEntity } from '../../infrastructure/entity/promotion-orm.entity';
import {
  DiscountAppliedDto,
  PromotionDto,
  PromotionRuleDto,
} from '../../application/dto/out/promotion.dto';
import {
  PromotionDetailDto,
  PromotionRuleDetailDto,
} from '../../application/dto/out/promotion-detail.dto';
import { PromotionPagedDto } from '../dto/out';

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

  static toDetailDto(
    domain: PromotionRuleDomainEntity,
    categoryNames: Map<number, string>,
  ): PromotionRuleDetailDto {
    return {
      idRegla: domain.idRegla,
      tipoCondicion: domain.tipoCondicion,
      valorCondicion: domain.valorCondicion,
      nombreCondicion: this.resolveConditionName(domain, categoryNames),
    };
  }

  static toOrm(domain: PromotionRuleDomainEntity): any {
    return {
      id_regla: domain.idRegla,
      id_promocion: domain.idPromocion,
      tipo_condicion: domain.tipoCondicion,
      valor_condicion: domain.valorCondicion,
    };
  }

  private static resolveConditionName(
    domain: PromotionRuleDomainEntity,
    categoryNames: Map<number, string>,
  ): string {
    switch (domain.tipoCondicion) {
      case 'CLIENTE_NUEVO':
        return this.resolveBooleanLabel(domain.valorCondicion);
      case 'CATEGORIA':
        return this.resolveCategoryName(domain.valorCondicion, categoryNames);
      default:
        return domain.valorCondicion;
    }
  }

  private static resolveBooleanLabel(value: string): string {
    const normalized = value?.trim().toLowerCase();

    if (['true', '1', 'si', 's??', 'yes'].includes(normalized)) {
      return 'SI';
    }

    if (['false', '0', 'no'].includes(normalized)) {
      return 'NO';
    }

    return value;
  }

  private static resolveCategoryName(
    value: string,
    categoryNames: Map<number, string>,
  ): string {
    const categoryId = Number(value);

    if (!Number.isInteger(categoryId)) {
      return value;
    }

    return categoryNames.get(categoryId) ?? value;
  }
}

export class DiscountAppliedMapper {
  static toDto(domain: any): DiscountAppliedDto {
    return {
      idDescuento: domain.idDescuento,
      monto: domain.monto,
    };
  }

  static toOrm(domain: any): any {
    return {
      id_descuento: domain.idDescuento,
      monto: domain.monto,
    };
  }
}

export class PromotionMapper {
  static toDomain(orm: PromotionOrmEntity): PromotionDomainEntity {
    return PromotionDomainEntity.create({
      idPromocion: orm.id_promocion,
      concepto: orm.concepto,
      tipo: orm.tipo,
      valor: Number(orm.valor),
      activo: orm.activo,
      reglas: (orm.rules ?? []).map(PromotionRuleMapper.toDomain),
      descuentosAplicados: (orm.discountsApplied ?? []).map((discount) => ({
        idDescuento: discount.id_descuento,
        monto: discount.monto,
      })),
    });
  }

  static toOrm(domain: PromotionDomainEntity): PromotionOrmEntity {
    const orm = new PromotionOrmEntity();
    orm.concepto = domain.concepto;
    orm.tipo = domain.tipo;
    orm.valor = domain.valor;
    orm.activo = domain.activo;
    orm.rules = (domain.reglas ?? []).map(PromotionRuleMapper.toOrm);
    orm.discountsApplied = (domain.descuentosAplicados ?? []).map(
      DiscountAppliedMapper.toOrm,
    );
    return orm;
  }

  static toResponseDto(domain: PromotionDomainEntity): PromotionDto {
    return {
      idPromocion: domain.idPromocion,
      concepto: domain.concepto,
      tipo: domain.tipo,
      valor: domain.valor,
      activo: domain.activo,
      reglas: (domain.reglas ?? []).map(PromotionRuleMapper.toDto),
      descuentosAplicados: (domain.descuentosAplicados ?? []).map(
        DiscountAppliedMapper.toDto,
      ),
    };
  }

  static toDetailDto(
    domain: PromotionDomainEntity,
    categoryNames: Map<number, string>,
  ): PromotionDetailDto {
    return {
      idPromocion: domain.idPromocion,
      concepto: domain.concepto,
      tipo: domain.tipo,
      valor: domain.valor,
      activo: domain.activo,
      reglas: (domain.reglas ?? []).map((rule) =>
        PromotionRuleMapper.toDetailDto(rule, categoryNames),
      ),
      descuentosAplicados: (domain.descuentosAplicados ?? []).map(
        DiscountAppliedMapper.toDto,
      ),
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
    limit: number,
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
