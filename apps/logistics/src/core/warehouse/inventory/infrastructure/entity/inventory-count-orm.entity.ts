export enum ConteoEstado {
  PENDIENTE = 'PENDIENTE',
  CONTADO = 'CONTADO',
  AJUSTADO = 'AJUSTADO',
  ANULADO = 'ANULADO',
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ConteoInventarioDetalleOrmEntity } from './inventory-count-detail-orm.entity';

@Entity('conteo_inventario')
export class ConteoInventarioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_conteo' })
  idConteo: number;

  @Column({ name: 'cod_sede' })
  codSede: string;

  @Column({ name: 'nom_sede' })
  nomSede: string;

  @Column({
    name: 'fecha_ini',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaIni: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fechaFin: Date;

  @Column({ name: 'estado', length: 20, default: 'INICIADO' })
  estado: ConteoEstado;

  @Column({ name: 'total_items', default: 0 })
  totalItems: number;

  @Column({
    name: 'total_diferencias',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalDiferencias: number;

  @Column({ name: 'usuario_creacion_ref' })
  usuarioCreacionRef: number;

  @UpdateDateColumn({ name: 'fec_actualizacion' })
  fecActualizacion: Date;

  @OneToMany(
    () => ConteoInventarioDetalleOrmEntity,
    (detalle) => detalle.conteo,
    { cascade: true },
  )
  detalles: ConteoInventarioDetalleOrmEntity[];
  @Column({ name: 'id_categoria', type: 'int', nullable: true })
  idCategoria: number | null;

  @Column({
    name: 'nom_categoria',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  nomCategoria: string | null;
}
