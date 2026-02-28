import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PromotionOrmEntity } from './promotion-orm.entity';

@Entity('regla_promocion')
export class PromotionRuleOrmEntity {
  @PrimaryGeneratedColumn()
  id_regla: number;

  @Column()
  id_promocion: number;

  @Column({ length: 100 })
  tipo_condicion: string;

  @Column({ length: 100 })
  valor_condicion: string;

  // RELATION
  @ManyToOne(() => PromotionOrmEntity, promo => promo.rules)
  @JoinColumn({ name: 'id_promocion' })
  promotion: PromotionOrmEntity;
}