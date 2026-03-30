

/* ============================================
   administration/src/core/permission/infrastructure/adapters/out/repository/permission.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPermissionRepositoryPort } from '../../../../domain/ports/out/permission-ports-out';
import { Permission } from '../../../../domain/entity/permission-domain-entity';
import { PermissionOrmEntity } from '../../../entity/permission-orm.entity';
import { PermissionMapper } from '../../../../application/mapper/permission.mapper';

@Injectable()
export class PermissionRepository implements IPermissionRepositoryPort {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    private readonly permissionOrmRepository: Repository<PermissionOrmEntity>,
  ) {}

  async save(permission: Permission): Promise<Permission> {
    const permissionOrm = PermissionMapper.toOrmEntity(permission);
    const saved = await this.permissionOrmRepository.save(permissionOrm);
    return PermissionMapper.toDomainEntity(saved);
  }

  async update(permission: Permission): Promise<Permission> {
    const permissionOrm = PermissionMapper.toOrmEntity(permission);
    await this.permissionOrmRepository.update(permission.id_permiso!, permissionOrm);
    const updated = await this.permissionOrmRepository.findOne({
      where: { id_permiso: permission.id_permiso },
      // Sin relations: 'padre' — solo necesitamos el id, el mapper lo lee de depende_de
    });
    return PermissionMapper.toDomainEntity(updated!);
  }

  async findAll(filters?: { activo?: boolean; search?: string }): Promise<Permission[]> {
    const queryBuilder = this.permissionOrmRepository.createQueryBuilder('permiso');

    if (filters?.activo !== undefined) {
      queryBuilder.andWhere('permiso.activo = :activo', { activo: filters.activo });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(permiso.nombre LIKE :search OR permiso.descripcion LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Orden natural: módulo → padre primero (depende_de NULL) → nombre
    queryBuilder.orderBy('permiso.modulo', 'ASC')
      .addOrderBy('ISNULL(permiso.depende_de)', 'DESC') // NULL primero = VER arriba
      .addOrderBy('permiso.nombre', 'ASC');

    const permissionsOrm = await queryBuilder.getMany();
    return permissionsOrm.map(p => PermissionMapper.toDomainEntity(p));
  }

  async delete(id: number): Promise<void> {
    await this.permissionOrmRepository.delete(id);
  }

  async findById(id: number): Promise<Permission | null> {
    const permissionOrm = await this.permissionOrmRepository.findOne({
      where: { id_permiso: id },
    });
    return permissionOrm ? PermissionMapper.toDomainEntity(permissionOrm) : null;
  }

  async findByName(nombre: string): Promise<Permission | null> {
    const permissionOrm = await this.permissionOrmRepository.findOne({
      where: { nombre },
    });
    return permissionOrm ? PermissionMapper.toDomainEntity(permissionOrm) : null;
  }


  async existsByName(nombre: string): Promise<boolean> {
    const count = await this.permissionOrmRepository.count({ where: { nombre } });
    return count > 0;
  }
}