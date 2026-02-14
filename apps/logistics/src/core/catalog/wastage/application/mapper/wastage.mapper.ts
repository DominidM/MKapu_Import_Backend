// Entidades de Dominio
import { Wastage, WastageDetail } from '../../domain/entity/wastage-domain-intity';
// Entidades de Persistencia (ORM)
import { WastageOrmEntity } from '../../infrastructure/entity/wastage-orm.entity';
import { WastageDetailOrmEntity } from '../../infrastructure/entity/wastage-detail.orm.entity';
// DTOs
import { WastageResponseDto } from '../dto/out/wastage-response.dto';

export class WastageMapper {
  static toDomain(orm: WastageOrmEntity): Wastage {
    const detalles = orm.detalles?.map(
      (d) => new WastageDetail(
        d.id_detalle,
        d.id_producto,
        d.cod_prod, 
        d.desc_prod,
        d.cantidad,
        Number(d.pre_unit),
        d.id_tipo_merma,
        d.observacion
      )
    ) || [];

    // 🚩 NUNCA hacer String() de IDs numéricos en el dominio
    return new Wastage(
      orm.id_merma,
      orm.id_usuario_ref,
      orm.id_sede_ref,          
      orm.id_almacen_ref,
      orm.motivo,
      orm.fec_merma,
      orm.estado,
      detalles
    );
  }

  static toPersistence(domain: Wastage): WastageOrmEntity {
    const orm = new WastageOrmEntity();
    orm.id_merma = domain.id_merma;
    orm.id_usuario_ref = domain.id_usuario_ref;
    orm.id_sede_ref = domain.id_sede_ref;           // number
    orm.id_almacen_ref = domain.id_almacen_ref;     // number
    orm.motivo = domain.motivo;
    orm.fec_merma = domain.fec_merma;
    orm.estado = domain.estado;

    orm.detalles = domain.detalles.map((d) => {
      const dOrm = new WastageDetailOrmEntity();
      dOrm.id_detalle = d.id_detalle;
      dOrm.id_producto = d.id_producto;
      dOrm.cod_prod = d.cod_prod;
      dOrm.desc_prod = d.desc_prod;
      dOrm.cantidad = d.cantidad;
      dOrm.pre_unit = d.pre_unit;
      dOrm.id_tipo_merma = d.id_tipo_merma;
      dOrm.observacion = d.observacion;
      dOrm.id_merma = domain.id_merma;
      return dOrm;
    });

    return orm;
  }

  static toResponseDto(domain: Wastage): WastageResponseDto {
    const dto = new WastageResponseDto();
    dto.id_merma = domain.id_merma;
    dto.fec_merma = domain.fec_merma;
    dto.motivo = domain.motivo;
    dto.total_items = domain.detalles.reduce((acc, d) => acc + d.cantidad, 0);
    dto.estado = domain.estado;
    return dto;
  }
}