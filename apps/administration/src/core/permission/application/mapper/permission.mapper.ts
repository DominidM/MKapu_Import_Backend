import { Permission } from '../../domain/entity/permission-domain-entity';
import { RegisterPermissionDto, UpdatePermissionDto } from '../dto/in';
import {
  PermissionResponseDto,
  PermissionListResponse,
  PermissionDeletedResponseDto,
} from '../dto/out';
import { PermissionOrmEntity } from '../../infrastructure/entity/permission-orm.entity';

export class PermissionMapper {

  static toResponseDto(permission: Permission): PermissionResponseDto {
    return {
      id_permiso:  permission.id_permiso!,
      nombre:      permission.nombre,
      descripcion: permission.descripcion,
      activo:      permission.activo!,
      modulo:      permission.modulo,      
      depende_de:  permission.depende_de,  
    };
  }

  static toListResponse(permissions: Permission[]): PermissionListResponse {
    return {
      permissions: permissions.map(p => this.toResponseDto(p)),
      total: permissions.length,
    };
  }

  static fromRegisterDto(dto: RegisterPermissionDto): Permission {
    return Permission.create({
      nombre:      dto.nombre,
      descripcion: dto.descripcion,
      activo:      true,
      modulo:      dto.modulo     ?? 'General', 
      depende_de:  dto.depende_de ?? null,      
    });
  }

  static fromUpdateDto(permission: Permission, dto: UpdatePermissionDto): Permission {
    return Permission.create({
      id_permiso:  permission.id_permiso,
      nombre:      dto.nombre      ?? permission.nombre,
      descripcion: dto.descripcion ?? permission.descripcion,
      activo:      permission.activo,
      modulo:      dto.modulo      ?? permission.modulo,     
      depende_de:  dto.depende_de  ?? permission.depende_de,  
    });
  }

  static withStatus(permission: Permission, activo: boolean): Permission {
    return Permission.create({
      id_permiso:  permission.id_permiso,
      nombre:      permission.nombre,
      descripcion: permission.descripcion,
      activo:      activo,
      modulo:      permission.modulo,      
      depende_de:  permission.depende_de,  
    });
  }

  static toDeletedResponse(id_permiso: number): PermissionDeletedResponseDto {
    return {
      id_permiso,
      message:   'Permiso eliminado exitosamente',
      deletedAt: new Date(),
    };
  }

  static toDomainEntity(orm: PermissionOrmEntity): Permission {
    return Permission.create({
      id_permiso:  orm.id_permiso,
      nombre:      orm.nombre,
      descripcion: orm.descripcion,
      activo:      Boolean(orm.activo),
      modulo:      orm.modulo,      
      depende_de:  orm.depende_de,  
    });
  }

  static toOrmEntity(permission: Permission): PermissionOrmEntity {
    const orm = new PermissionOrmEntity();
    if (permission.id_permiso) orm.id_permiso = permission.id_permiso;
    orm.nombre      = permission.nombre;
    orm.descripcion = permission.descripcion ?? '';
    orm.activo      = permission.activo      ?? true;
    orm.modulo      = permission.modulo;      
    orm.depende_de  = permission.depende_de;  
    return orm;
  }
}