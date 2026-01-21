
/* ============================================
   administration/src/core/role/infrastructure/entity/role-orm.entity.ts
   ============================================ */

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rol')
export class RoleOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @Column({ name: 'nombre', type: 'varchar', length: 45, unique: true })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 45, nullable: true })
  descripcion: string;

  @Column({ name: 'activo', type: 'tinyint', default: 1 })
  activo: number;
}