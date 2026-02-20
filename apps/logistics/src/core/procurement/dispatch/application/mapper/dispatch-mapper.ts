import { Dispatch } from '../../domain/entity/dispatch-domain-entity';
import { DispatchOrmEntity } from '../../infrastructure/entity/dispatch-orm.entity';
import { CreateDispatchDto } from '../dto/in/dispatch-dto-in';
import { UpdateDispatchDto } from '../dto/in/update-dispatch-dto';
import { DispatchDtoOut } from '../dto/out/dispatch-dto-out';

export class DispatchMapper {
  static toResponseDto(entity: Dispatch): DispatchDtoOut {
    return {
      id_despacho: entity.id_despacho,
      id_venta_ref: entity.id_venta_ref,
      id_usuario_ref: entity.id_usuario_ref,
      id_almacen_origen: entity.id_almacen_origen,
      fecha_creacion: entity.fecha_creacion,
      fecha_programada: entity.fecha_programada,
      fecha_salida: entity.fecha_salida || null,
      fecha_entrega: entity.fecha_entrega || null,
      direccion_entrega: entity.direccion_entrega,
      observacion: entity.observacion,
      estado: entity.estado,
    };
  }

  static fromCreateDto(dto: CreateDispatchDto): Dispatch {
    return Dispatch.create({
      id_venta_ref: dto.id_venta_ref,
      id_usuario_ref: dto.id_usuario_ref,
      id_almacen_origen: dto.id_almacen_origen,
      fecha_programada: new Date(dto.fecha_programada),
      direccion_entrega: dto.direccion_entrega,
      observacion: dto.observacion,
    });
  }

  static fromUpdateDto(
    dispatch: DispatchDtoOut,
    dto: UpdateDispatchDto,
  ): Dispatch {
    return Dispatch.create({
      id_despacho: dispatch.id_despacho,
      id_venta_ref: dispatch.id_venta_ref,
      id_usuario_ref: dispatch.id_usuario_ref,
      id_almacen_origen: dispatch.id_almacen_origen,
      fecha_creacion: dispatch.fecha_creacion,
      fecha_programada: dto.fecha_programada
        ? new Date(dto.fecha_programada)
        : dispatch.fecha_programada,
      direccion_entrega: dto.direccion_entrega ?? dispatch.direccion_entrega,
      observacion: dto.observacion ?? dispatch.observacion,
      estado: dto.estado ?? dispatch.estado,
    });
  }

  static toDomainEntity(ormEntity: DispatchOrmEntity): Dispatch {
    return Dispatch.create({
      id_despacho: ormEntity.id_despacho,
      id_venta_ref: ormEntity.id_venta_ref,
      id_usuario_ref: ormEntity.id_usuario_ref,
      id_almacen_origen: ormEntity.id_almacen_origen,
      fecha_creacion: ormEntity.fecha_creacion,
      fecha_programada: ormEntity.fecha_programada,
      fecha_salida: ormEntity.fecha_salida || undefined,
      fecha_entrega: ormEntity.fecha_entrega || undefined,
      direccion_entrega: ormEntity.direccion_entrega,
      observacion: ormEntity.observacion || undefined,
      estado: ormEntity.estado,
    });
  }

  static toOrmEntity(dispatch: Dispatch): DispatchOrmEntity {
    const ormEntity = new DispatchOrmEntity();
    if (dispatch.id_despacho) ormEntity.id_despacho = dispatch.id_despacho;

    ormEntity.id_venta_ref = dispatch.id_venta_ref;
    ormEntity.id_usuario_ref = dispatch.id_usuario_ref;
    ormEntity.id_almacen_origen = dispatch.id_almacen_origen;
    ormEntity.fecha_creacion = dispatch.fecha_creacion;
    ormEntity.fecha_programada = dispatch.fecha_programada;
    ormEntity.fecha_salida = dispatch.fecha_salida;
    ormEntity.fecha_entrega = dispatch.fecha_entrega;
    ormEntity.direccion_entrega = dispatch.direccion_entrega;
    ormEntity.observacion = dispatch.observacion;
    ormEntity.estado = dispatch.estado;

    return ormEntity;
  }
}
