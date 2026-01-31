import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pago')
export class PaymentOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id: number;

  @Column({ name: 'id_comprobante' })
  idComprobante: number;

  @Column({ name: 'id_tipo_pago' })
  idTipoPago: number;

  @Column({ name: 'monto', type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @CreateDateColumn({ name: 'fec_pago' })
  fecPago: Date;
}