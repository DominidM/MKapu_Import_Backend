// application/mapper/caja.mapper.ts

import { Caja } from '../../domain/entity/caja-domain-entity';
import { ProductOrmEntity } from '../../../product/infrastructure/entity/product-orm.entity';
import { CajaOrmEntity } from '../../infrastructure/entity/caja-orm-entity';
import { CajaResponseDto } from '../dto/out/caja-response.dto';

export class CajaMapper {
  static toDomain(orm: CajaOrmEntity): Caja {
    return Caja.create({
      id_caja:           orm.id_caja,
      id_producto:       orm.id_producto,
      cantidad_unidades: orm.cantidad_unidades,
      cod_caja:          orm.cod_caja,
      pre_caja:          Number(orm.pre_caja),
      pre_mayorista:     orm.pre_mayorista != null ? Number(orm.pre_mayorista) : null,
    });
  }

  static toOrm(caja: Caja): CajaOrmEntity {
    const orm             = new CajaOrmEntity();
    if (caja.id_caja)     orm.id_caja = caja.id_caja;
    orm.id_producto       = caja.id_producto;
    orm.producto          = { id_producto: caja.id_producto } as ProductOrmEntity;
    orm.cantidad_unidades = caja.cantidad_unidades;
    orm.cod_caja          = caja.cod_caja;
    orm.pre_caja          = caja.pre_caja;
    orm.pre_mayorista     = caja.pre_mayorista;
    return orm;
  }

  static toResponseDto(caja: Caja): CajaResponseDto {
    return {
      id_caja:           caja.id_caja!,
      id_producto:       caja.id_producto,
      cantidad_unidades: caja.cantidad_unidades,
      cod_caja:          caja.cod_caja,
      pre_caja:          caja.pre_caja,
      pre_mayorista:     caja.pre_mayorista,
    };
  }
}