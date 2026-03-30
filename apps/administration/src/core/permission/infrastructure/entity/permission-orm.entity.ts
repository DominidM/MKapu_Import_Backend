import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'permiso' })
export class PermissionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_permiso', type: 'int' })
  id_permiso: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ name: 'activo', type: 'tinyint', width: 1, default: 1 })
  activo: boolean;

  @Column({ name: 'modulo', type: 'varchar', length: 50, default: 'General' })
  modulo: string;

  @Column({ name: 'depende_de', type: 'int', nullable: true, default: null })
  depende_de: number | null;

  @ManyToOne(() => PermissionOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'depende_de' })
  padre?: PermissionOrmEntity;
}