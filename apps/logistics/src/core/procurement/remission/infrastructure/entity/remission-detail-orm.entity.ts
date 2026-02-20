import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { RemissionOrmEntity } from './remission-orm.entity';
import { ProductOrmEntity } from '../../../../catalog/product/infrastructure/entity/product-orm.entity';

@Entity('guia_remision_detalle')
export class RemissionDetailOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  id_detalle: number;

  @ManyToOne(() => RemissionOrmEntity, (guia) => guia.id_guia, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_guia' })
  guia: RemissionOrmEntity;

  @Column({ name: 'id_guia', type: 'char', length: 36 })
  id_guia: string;

  @Column({ name: 'cod_prod', type: 'varchar', length: 50 })
  cod_prod: string;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad: number;

  @Column({ name: 'peso_unitario', type: 'decimal', precision: 10, scale: 3 })
  peso_unitario: number;

  @Column({ name: 'peso_total', type: 'decimal', precision: 10, scale: 3 })
  peso_total: number;

  // --- RELACIÓN CON PRODUCTO (Catálogo) ---
  @ManyToOne(() => ProductOrmEntity, { nullable: true })
  @JoinColumn({ name: 'id_producto' })
  producto: ProductOrmEntity;

  @Column({ name: 'id_producto', type: 'int', nullable: true })
  id_producto: number;
}
