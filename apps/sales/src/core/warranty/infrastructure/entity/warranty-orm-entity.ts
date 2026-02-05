/* sales/src/core/warranty/infrastructure/entity/warranty-orm-entity.ts */
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { WarrantyDetailOrmEntity } from './warranty-detail-orm.entity';
import { WarrantyTrackingOrmEntity } from './warranty-tracking-orm.entity';
import { WarrantyStatusOrmEntity } from './warranty-status-orm.entity';

@Entity({ name: 'garantia'})
export class WarrantyOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_garantia' })
  id_garantia: number;

  @Column({ name: 'id_estado_garantia' })
  id_estado_garantia: number;

  @Column({ name: 'id_comprobante' })
  id_comprobante: number;

  @Column({ name: 'id_usuario_recepcion' })
  id_usuario_recepcion: number; // Según tu BD es int

  @Column({ name: 'id_sede_ref' })
  id_sede_ref: number;

  @Column({ name: 'num_garantia', length: 20 })
  num_garantia: string;

  @Column({ name: 'fec_solicitud', type: 'datetime' })
  fec_solicitud: Date;

  @Column({ name: 'fec_recepcion', length: 45, nullable: true })
  fec_recepcion: string; // En tu BD es varchar(45)

  @Column({ name: 'cod_prod', length: 50 })
  cod_prod: string;

  @Column({ name: 'prod_nombre', length: 150 })
  prod_nombre: string;

  // Relaciones para el Mapper (image_c16d4a)
  @ManyToOne(() => WarrantyStatusOrmEntity)
  @JoinColumn({ name: 'id_estado_garantia' })
  estado: WarrantyStatusOrmEntity;

  @OneToMany(() => WarrantyDetailOrmEntity, (detail) => detail.warranty, { cascade: true })
  details: WarrantyDetailOrmEntity[];

  @OneToMany(() => WarrantyTrackingOrmEntity, (track) => track.warranty, { cascade: true })
  tracking: WarrantyTrackingOrmEntity[];
  
  // Mapeos virtuales para cliente/comprobante si el mapper los requiere
  cliente?: { id_cliente: number };
  comprobante?: { id_comprobante: number };
}