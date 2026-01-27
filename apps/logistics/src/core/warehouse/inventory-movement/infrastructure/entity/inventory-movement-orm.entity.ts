/* eslint-disable prettier/prettier */
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryMovementDetailOrmEntity } from './inventory-movement-detail-orm.entity';

@Entity({ name: 'movimiento_inventario', schema: 'mkp_logistica' })
export class InventoryMovementOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_movimiento', type: 'int' })
  id: number;

  @Column({
    name: 'tipo_origen',
    type: 'enum',
    enum: ['TRANSFERENCIA', 'COMPRA', 'VENTA', 'AJUSTE'],
    default: 'TRANSFERENCIA',
  })
  originType: string;

  @Column({ name: 'ref_id', type: 'int' })
  refId: number;

  @Column({ name: 'ref_tabla', type: 'varchar', length: 50 })
  refTable: string;

  @CreateDateColumn({ name: 'fecha' })
  date: Date;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observation: string;

  // Relación con el detalle
  @OneToMany(
    () => InventoryMovementDetailOrmEntity,
    (detail) => detail.movement,
    { cascade: true },
  )
  details: InventoryMovementDetailOrmEntity[];
}