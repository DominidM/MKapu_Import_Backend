/* ============================================
   administration/src/core/role/application/mapper/role.mapper.ts
   ============================================ */

import { Role } from '../../domain/entity/role-domain-entity';
import { RegisterRoleDto, UpdateRoleDto } from '../dto/in';
import {
  RoleResponseDto,
  RoleListResponse,
  RoleDeletedResponseDto,
} from '../dto/out';

export class RoleMapper {
  static toResponseDto(role: Role): RoleResponseDto {
    return {
      id_rol: role.id_rol!,
      nombre: role.nombre,
      descripcion: role.descripcion,
      activo: role.activo!,
    };
  }

  static toListResponse(roles: Role[]): RoleListResponse {
    return {
      roles: roles.map((role) => this.toResponseDto(role)),
      total: roles.length,
    };
  }

  static fromRegisterDto(dto: RegisterRoleDto): Role {
    return Role.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: true,
    });
  }

  static fromUpdateDto(role: Role, dto: UpdateRoleDto): Role {
    return Role.create({
      id_rol: role.id_rol,
      nombre: dto.nombre ?? role.nombre,
      descripcion: dto.descripcion ?? role.descripcion,
      activo: role.activo,
    });
  }

  static withStatus(role: Role, activo: boolean): Role {
    return Role.create({
      id_rol: role.id_rol,
      nombre: role.nombre,
      descripcion: role.descripcion,
      activo: activo,
    });
  }

  static toDeletedResponse(id_rol: number): RoleDeletedResponseDto {
    return {
      id_rol,
      message: 'Rol eliminado exitosamente',
      deletedAt: new Date(),
    };
  }
}