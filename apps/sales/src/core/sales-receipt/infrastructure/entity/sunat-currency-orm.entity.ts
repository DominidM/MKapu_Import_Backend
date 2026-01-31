/* ============================================
   sales/src/core/salesreceipt/infrastructure/entity/sunat-currency-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('sunat_moneda')
export class SunatCurrencyOrmEntity {
  @PrimaryColumn({ type: 'char', length: 3, name: 'codigo' })
  codigo: string;

  @Column({ type: 'varchar', length: 50, name: 'descripcion' })
  descripcion: string;
}