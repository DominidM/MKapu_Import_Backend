import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PromotionOrmEntity } from './promotion-orm.entity';

@Entity('descuento_aplicado')
export class DiscountAppliedOrmEntity {
  @PrimaryGeneratedColumn()
  id_descuento: number; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column()
  id_promocion: number;

  // RELATION
  @ManyToOne(() => PromotionOrmEntity, promo => promo.discountsApplied)
  @JoinColumn({ name: 'id_promocion' })
  promotion: PromotionOrmEntity;
}