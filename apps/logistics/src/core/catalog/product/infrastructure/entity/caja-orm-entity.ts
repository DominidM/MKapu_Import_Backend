// infrastructure/entity/caja-orm-entity.ts

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductOrmEntity } from '../../../product/infrastructure/entity/product-orm.entity';

@Entity({ name: 'caja' })
export class CajaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_caja', type: 'int' })
  id_caja: number;

  @ManyToOne(() => ProductOrmEntity, { eager: true })
  @JoinColumn({ name: 'id_producto' })
  producto: ProductOrmEntity;

  @Column({ name: 'id_producto', type: 'int' })
  id_producto: number;

  @Column({ name: 'cantidad_unidades', type: 'int' })
  cantidad_unidades: number;

  @Column({ name: 'cod_caja', type: 'varchar', length: 10 })
  cod_caja: string;

  @Column({ name: 'pre_caja', type: 'decimal', precision: 10, scale: 2 })
  pre_caja: number;

  @Column({
    name: 'pre_mayorista',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  pre_mayorista: number | null;
}