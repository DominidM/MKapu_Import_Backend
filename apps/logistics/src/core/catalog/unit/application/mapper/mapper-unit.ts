import { Unit, UnitStatus } from '../../domain/entity/unit-domain-entity';
import { UnitOrmEntity } from '../../infrastructure/entity/unit-orm.entity';

export class MapperUnit {
  static toDomain(e: UnitOrmEntity): Unit {
    return new Unit(
      e.id_producto || e.producto?.id_producto || e.producto?.id_producto,
      e.id_almacen || e.almacen?.id_almacen || e.almacen?.id_almacen,
      e.serie,
      e.fec_venc,
      e.estado as UnitStatus,
      e.id_unidad,
    );
  }
}
