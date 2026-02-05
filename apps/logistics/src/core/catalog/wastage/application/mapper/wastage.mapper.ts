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
        d.id_detalle,       // Coincide con tu PrimaryGeneratedColumn
        d.id_producto,      // Variable de tu ORM
        d.cod_prod,         // Variable de tu ORM
        d.desc_prod,        // Variable de tu ORM
        d.cantidad,         // Variable de tu ORM
        Number(d.pre_unit), // Conversión decimal a number
        d.id_tipo_merma,    // Variable de tu ORM
        d.observacion       // Variable de tu ORM
      )
    ) || [];

    // PASAMOS LOS 8 PARÁMETROS EN EL ORDEN DEL CONSTRUCTOR DEL DOMINIO
    return new Wastage(
      orm.id_merma,         // 1. id_merma
      orm.id_usuario_ref,   // 2. id_usuario_ref
      String(orm.id_sede_ref), // 3. id_sede_ref (Convertimos a string para el dominio)
      // Nota: Si id_almacen_ref no está en el ORM, aquí dará error. 
      // Si ya lo agregaste al ORM de Wastage lo usamos:
      (orm as any).id_almacen_ref, // 4. id_almacen_ref
      orm.motivo,           // 5. motivo
      orm.fec_merma,        // 6. fec_merma
      orm.estado,           // 7. estado
      detalles              // 8. detalles
    );
  }

  static toPersistence(domain: Wastage): WastageOrmEntity {
    const orm = new WastageOrmEntity();
    orm.id_merma = domain.id_merma;
    orm.id_usuario_ref = domain.id_usuario_ref;
    // Forzamos conversión si el ORM espera number y el dominio tiene string
    orm.id_sede_ref = Number(domain.id_sede_ref); 
    orm.motivo = domain.motivo;
    orm.fec_merma = domain.fec_merma;
    orm.estado = domain.estado;
    
    // Si agregaste id_almacen_ref al ORM de Wastage:
    if ('id_almacen_ref' in orm) {
      (orm as any).id_almacen_ref = domain.id_almacen_ref;
    }

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
      dOrm.id_merma = domain.id_merma; // Sincronización de FK
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