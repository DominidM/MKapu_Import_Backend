/* marketing/src/core/promotion/application/mapper/promotion.mapper.ts */

import { Promotion } from '../../domain/entity/promotion-domain-entity';
import { PromotionOrmEntity } from '../../infrastructure/entity/promotion-orm.entity';

export class PromotionMapper {
  // ORM → Domain
  static toDomain(orm: PromotionOrmEntity): Promotion {
    return Promotion.create({
      idPromocion: orm.id_promocion,
      concepto: orm.concepto,
      tipo: orm.tipo,
      valor: Number(orm.valor),
      activo: orm.activo,
    });
  }

  // Domain → ORM
  static toOrm(domain: Promotion): PromotionOrmEntity {
    const orm = new PromotionOrmEntity();

    if (domain.idPromocion !== undefined) {
      orm.id_promocion = domain.idPromocion;
    }

    orm.concepto = domain.concepto;
    orm.tipo = domain.tipo;
    orm.valor = domain.valor;
    orm.activo = domain.activo;

    return orm;
  }

  // Domain → Response DTO
  static toResponseDto(domain: Promotion): any {
    return {
      idPromocion: domain.idPromocion,
      concepto: domain.concepto,
      tipo: domain.tipo,
      valor: domain.valor,
      activo: domain.activo,
    };
  }

  // Lista ORM → Lista Domain
  static toDomainList(ormList: PromotionOrmEntity[]): Promotion[] {
    return ormList.map((orm) => this.toDomain(orm));
  }
}