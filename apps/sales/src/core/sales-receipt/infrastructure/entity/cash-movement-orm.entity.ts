import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('movimiento_caja')
export class CashMovementOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id: number;

  @Column({ name: 'id_caja', type: 'varchar', length: 255 })
  idCaja: string;

  @Column({ name: 'id_tipo_pago' })
  idTipoPago: number;

  @Column({ name: 'tipo_mov', type: 'enum', enum: ['INGRESO', 'EGRESO'] })
  tipoMov: string;

  @Column({ name: 'concepto', type: 'varchar', length: 200 })
  concepto: string;

  @Column({ name: 'monto', type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}