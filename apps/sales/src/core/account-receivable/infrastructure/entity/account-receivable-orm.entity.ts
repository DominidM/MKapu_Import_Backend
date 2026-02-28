/* ============================================
   sales/src/core/account-receivable/infrastructure/entity/account-receivable-orm.entity.ts
   ============================================ */

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SalesReceiptOrmEntity } from '../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { PaymentTypeOrmEntity }   from '../../../sales-receipt/infrastructure/entity/payment-type-orm.entity';
import { SunatCurrencyOrmEntity } from '../../../sales-receipt/infrastructure/entity/sunat-currency-orm.entity';

export enum AccountReceivableStatus {
  PENDIENTE = 'PENDIENTE',
  PARCIAL   = 'PARCIAL',
  PAGADO    = 'PAGADO',
  VENCIDO   = 'VENCIDO',
  CANCELADO = 'CANCELADO',
}

@Entity('cuenta_por_cobrar')
export class AccountReceivableOrmEntity {

  @PrimaryGeneratedColumn({ name: 'id_cuenta' })
  id: number;

  // ── FK → comprobante_venta ────────────────────────────────────────
  @Column({ name: 'id_comprobante_venta' })
  salesReceiptId: number;

  @ManyToOne(() => SalesReceiptOrmEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_comprobante_venta' })
  salesReceipt: SalesReceiptOrmEntity;

  // ── Usuario responsable ───────────────────────────────────────────
  @Column({ name: 'id_usuario_ref', type: 'varchar', length: 255 })
  userRef: string;

  // ── Montos ────────────────────────────────────────────────────────
  @Column({ name: 'monto_total', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'monto_pagado', type: 'decimal', precision: 10, scale: 2 })
  paidAmount: number;

  @Column({ name: 'saldo_pendiente', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pendingBalance: number | null;

  // ── Fechas ────────────────────────────────────────────────────────
  @CreateDateColumn({
    name: 'fecha_emision',
    type: 'datetime',
  })
  issueDate: Date;

  @Column({ name: 'fecha_vencimiento', type: 'datetime' })
  dueDate: Date;

  //  @UpdateDateColumn → TypeORM asigna la fecha automáticamente en INSERT y UPDATE
  @UpdateDateColumn({
    name: 'fecha_actualizacion',
    type: 'datetime',
  })
  updatedAt: Date;

  // ── Estado ────────────────────────────────────────────────────────
  @Column({
    name: 'estado',
    type: 'enum',
    enum: AccountReceivableStatus,
    default: AccountReceivableStatus.PENDIENTE,
  })
  status: AccountReceivableStatus;

  // ── FK → tipo_pago ────────────────────────────────────────────────
  @Column({ name: 'tipo_pago' })
  paymentTypeId: number;

  @ManyToOne(() => PaymentTypeOrmEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tipo_pago' })
  paymentType: PaymentTypeOrmEntity;

  // ── FK → sunat_moneda ─────────────────────────────────────────────
  @Column({ name: 'sunat_moneda', type: 'char', length: 3 })
  currencyCode: string;

  @ManyToOne(() => SunatCurrencyOrmEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sunat_moneda', referencedColumnName: 'codigo' })
  currency: SunatCurrencyOrmEntity;

  // ── Observación ───────────────────────────────────────────────────
  @Column({ name: 'observacion', type: 'text', nullable: true })
  observation: string | null;
}