import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PromotionRuleOrmEntity } from './promotion_rule-orm.entity';
import { DiscountAppliedOrmEntity } from './discount_applied-orm.entity';

@Entity('promocion')
export class PromotionOrmEntity {
  @PrimaryGeneratedColumn()
  id_promocion: number;

  @Column({ length: 100 })
  concepto: string;

  @Column({ length: 30 })
  tipo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => PromotionRuleOrmEntity, rule => rule.promotion, { cascade: true, eager: true })
  rules: PromotionRuleOrmEntity[];

  @OneToMany(() => DiscountAppliedOrmEntity, discount => discount.promotion, { cascade: true, eager: true })
  discountsApplied: DiscountAppliedOrmEntity[];
}