import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { ConteoInventarioOrmEntity } from './inventory-count-orm.entity';

@Entity('detalle_conteo')
export class ConteoInventarioDetalleOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  idDetalle: number;

  @ManyToOne(() => ConteoInventarioOrmEntity, (conteo) => conteo.detalles)
  @JoinColumn({ name: 'id_conteo' })
  conteo: ConteoInventarioOrmEntity;

  @Column({ name: 'id_producto' })
  idProducto: number;

  @Column({ name: 'cod_prod' })
  codProd: string;

  @Column({ name: 'descripcion' })
  descripcion: string;

  @Column({ name: 'uni_med' })
  uniMed: string;

  @Column({ name: 'id_stock' })
  idStock: number;

  @Column({ name: 'id_almacen' })
  idAlmacen: number;

  @Column({ name: 'id_sede_ref' })
  idSedeRef: number;

  @Column({ name: 'stock_sistema', type: 'decimal', precision: 12, scale: 2 })
  stockSistema: number;

  @Column({
    name: 'stock_conteo',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  stockConteo: number;

  @Column({
    name: 'diferencia',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  diferencia: number;

  @Column({ name: 'estado', default: 1 })
  estado: number;

  @Column({ name: 'observacion', nullable: true })
  observacion: string;

  @Column({
    name: 'fecha_inicio',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaInicioDetalle: Date;
}
