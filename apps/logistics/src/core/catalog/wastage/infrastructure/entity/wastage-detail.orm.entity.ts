import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { WastageOrmEntity } from './wastage-orm.entity'; 
@Entity('detalle_merma')
export class WastageDetailOrmEntity {
  @PrimaryGeneratedColumn()
  id_detalle: number;

  @Column({ length: 50 })
  cod_prod: string;

  @Column({ length: 150 })
  desc_prod: string;

  @Column('int')
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pre_unit: number;

  @Column({ length: 255, nullable: true })
  observacion: string;

  @Column()
  id_merma: number;

  @Column()
  id_producto: number;

  @Column()
  id_tipo_merma: number;

  @ManyToOne(() => WastageOrmEntity, (wastage) => wastage.detalles)
  @JoinColumn({ name: 'id_merma' })
  merma: WastageOrmEntity;
}