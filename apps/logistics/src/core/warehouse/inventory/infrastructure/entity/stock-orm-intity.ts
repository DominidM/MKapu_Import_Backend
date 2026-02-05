import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'stock', schema: 'mkp_logistica' })
export class StockOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_stock' })
  id_stock: number;

  @Column({ name: 'id_producto' })
  id_producto: number;

  @Column({ name: 'id_almacen' })
  id_almacen: number;

  @Column({ name: 'id_sede', length: 50 })
  id_sede: string;

  @Column({ name: 'tipo_ubicacion', length: 50 })
  tipo_ubicacion: string;

  @Column({ name: 'cantidad' })
  cantidad: number;

  @Column({ name: 'estado', length: 50 })
  estado: string;
}
