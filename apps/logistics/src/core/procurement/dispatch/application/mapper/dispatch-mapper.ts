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
      tipo_envio: entity.tipo_envio,
      estado: entity.estado,
      fecha_envio: entity.fecha_envio,
    };
  }

  static fromCreateDto(dto: CreateDispatchDto): Dispatch {
    return Dispatch.create({
      id_despacho: dto.id_despacho,
      id_venta_ref: dto.id_venta_ref,
      tipo_envio: dto.tipo_envio,
      estado: dto.estado,
      fecha_envio: new Date(dto.fecha_envio),
    });
  }

  static fromUpdateDto(dispatch: Dispatch, dto: UpdateDispatchDto): Dispatch {
    return Dispatch.create({
      id_despacho: dispatch.id_despacho,
      id_venta_ref: dto.id_venta_ref ?? dispatch.id_venta_ref,
      tipo_envio: dto.tipo_envio ?? dispatch.tipo_envio,
      estado: dto.estado ?? dispatch.estado,
      fecha_envio: dto.fecha_envio
        ? new Date(dto.fecha_envio)
        : dispatch.fecha_envio,
    });
  }

  static toDomainEntity(ormEntity: DispatchOrmEntity): Dispatch {
    return Dispatch.create({
      id_despacho: ormEntity.id_despacho,
      id_venta_ref: ormEntity.id_venta_ref,
      tipo_envio: ormEntity.tipo_envio,
      estado: ormEntity.estado,
      fecha_envio: ormEntity.fecha_envio,
    });
  }

  static toOrmEntity(dispatch: Dispatch): DispatchOrmEntity {
    const ormEntity = new DispatchOrmEntity();
    if (dispatch.id_despacho !== null) {
      ormEntity.id_despacho = dispatch.id_despacho;
    }

    ormEntity.id_venta_ref = dispatch.id_venta_ref;
    ormEntity.tipo_envio = dispatch.tipo_envio;
    ormEntity.estado = dispatch.estado;
    ormEntity.fecha_envio = dispatch.fecha_envio;

    return ormEntity;
  }
}
