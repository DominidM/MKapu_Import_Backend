import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuoteOrmEntity } from './quote-orm.entity';

@Entity('detalle_cotizacion')
export class QuoteDetailOrmEntity {
  @PrimaryGeneratedColumn()
  id_detalle: number;

  @Column()
  id_cotizacion: number;

  @Column()
  id_prod_ref: number;

  @Column({ type: 'varchar', length: 20 })
  cod_prod: string;

  @Column({ type: 'varchar', length: 200 })
  descripcion: string;

  @Column()
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  // Relación con cotización
  @ManyToOne(() => QuoteOrmEntity, quote => quote.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cotizacion' })
  cotizacion: QuoteOrmEntity;
}