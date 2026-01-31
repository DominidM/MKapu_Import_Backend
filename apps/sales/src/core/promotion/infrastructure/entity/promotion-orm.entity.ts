/* marketing/src/core/promotion/infrastructure/entity/promotion-orm.entity.ts */

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('promocion')
export class PromotionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_promocion' })
  id_promocion: number;

  @Column({ type: 'varchar', length: 100, name: 'concepto' })
  concepto: string;

  @Column({ type: 'varchar', length: 30, name: 'tipo' })
  tipo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valor' })
  valor: number;

  @Column({ type: 'bit', name: 'activo', default: true })
  activo: boolean;
}