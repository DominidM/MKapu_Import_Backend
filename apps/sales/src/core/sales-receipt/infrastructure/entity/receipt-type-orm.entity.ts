/* ============================================
   sales/src/core/salesreceipt/infrastructure/entity/receipt-type-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tipo_comprobante')
export class ReceiptTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_comprobante' })
  id_tipo_comprobante: number;

  @Column({ type: 'char', length: 2, name: 'cod_sunat' })
  cod_sunat: string;

  @Column({ type: 'varchar', length: 100, name: 'descripcion' })
  descripcion: string;

  @Column({ type: 'bit', name: 'estado', default: true })
  estado: boolean;
}