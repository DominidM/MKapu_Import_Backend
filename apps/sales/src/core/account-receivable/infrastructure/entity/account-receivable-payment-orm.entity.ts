// sales/src/core/account-receivable/infrastructure/entity/account-receivable-payment-orm.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountReceivableOrmEntity } from './account-receivable-orm.entity';
import { PaymentTypeOrmEntity }       from '../../../sales-receipt/infrastructure/entity/payment-type-orm.entity';

export enum PaymentStatus {
  CONFIRMADO = 'CONFIRMADO',
  PENDIENTE  = 'PENDIENTE',
  RECHAZADO  = 'RECHAZADO',
}

@Entity('pago_cuenta_cobrar')
export class AccountReceivablePaymentOrmEntity {

  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id: number;

  // ── FK → cuenta_por_cobrar ────────────────────────────────────────
  @Column({ name: 'id_cuenta' })
  accountReceivableId: number;

  @ManyToOne(() => AccountReceivableOrmEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cuenta' })
  accountReceivable: AccountReceivableOrmEntity;

  // ── Monto del abono ───────────────────────────────────────────────
  @Column({ name: 'monto', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // ── FK → tipo_pago ────────────────────────────────────────────────
  @Column({ name: 'tipo_pago' })
  paymentTypeId: number;

  @ManyToOne(() => PaymentTypeOrmEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tipo_pago' })  // TypeORM usa la PK de PaymentTypeOrmEntity automáticamente
  paymentType: PaymentTypeOrmEntity;

  // ── Referencia / número de operación ─────────────────────────────
  @Column({ name: 'referencia', type: 'varchar', length: 255, nullable: true })
  referencia: string | null;

  // ── Estado del pago ───────────────────────────────────────────────
  @Column({
    name:    'estado',
    type:    'enum',
    enum:    PaymentStatus,
    default: PaymentStatus.CONFIRMADO,
  })
  status: PaymentStatus;

  // ── Fecha del abono ───────────────────────────────────────────────
  @CreateDateColumn({ name: 'fecha_pago', type: 'datetime' })
  fecPago: Date;
}