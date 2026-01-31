import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('voucher')
export class VoucherOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_voucher' })
  id: number;

  @Column({ name: 'tipo_pago' })
  tipoPago: number;

  @Column({ name: 'sunat_moneda', type: 'char', length: 3 })
  moneda: string;

  @Column({ name: 'id_comprobante' })
  idComprobante: number;

  @CreateDateColumn({ name: 'fec_transaccion' })
  fecTransaccion: Date;

  @Column({ name: 'importe', type: 'decimal', precision: 10, scale: 2 })
  importe: number;

  @Column({ name: 'num_operacion', type: 'varchar', length: 100 })
  numOperacion: string;

  @Column({ name: 'ultimos_digitos', type: 'char', length: 4 })
  ultimosDigitos: string;
}