import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductOrmEntity } from '../../../product/infrastructure/entity/product-orm.entity';
import { AlmacenOrmEntity } from './almacen-orm.entity';

@Entity({ name: 'stock', schema: 'mkp_logistica' })
export class StockOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_stock', type: 'int' })
  id_stock: number;

  @ManyToOne(() => ProductOrmEntity, { eager: true })
  @JoinColumn({ name: 'id_producto' })
  producto: ProductOrmEntity;

  @ManyToOne(() => AlmacenOrmEntity, { eager: false })
  @JoinColumn({ name: 'id_almacen' })
  almacen: AlmacenOrmEntity;

  @Column({ name: 'id_sede', type: 'varchar', length: 50 })
  id_sede: string;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad: number;

  @Column({ name: 'tipo_ubicacion', type: 'varchar', length: 50 })
  tipo_ubicacion: string;

  @Column({ name: 'estado', type: 'varchar', length: 50 })
  estado: string;
}
