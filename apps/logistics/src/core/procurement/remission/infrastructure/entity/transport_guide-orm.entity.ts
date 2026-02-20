import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RemissionOrmEntity } from './remission-orm.entity';

@Entity('guia_traslado')
export class GuideTransferOrm {
  @PrimaryGeneratedColumn({ name: 'id_traslado' })
  id_straslado: number;

  @ManyToOne(() => RemissionOrmEntity)
  @JoinColumn({ name: 'id_guia' })
  guia: RemissionOrmEntity;

  @Column({ name: 'id_guia', type: 'char', length: 36 })
  id_guia: string;

  @Column({ name: 'direccion_origen', type: 'varchar', length: 255 })
  direccion_origen: string;

  @Column({ name: 'ubigeo_origen', type: 'char', length: 6 })
  ubigeo_origen: string;

  @Column({ name: 'direccion_destino', type: 'varchar', length: 255 })
  direccion_destino: string;

  @Column({ name: 'ubigeo_destino', type: 'char', length: 6 })
  ubigeo_destino: string;

  @Column({ name: 'fecha_llegada', type: 'datetime', nullable: true })
  fecha_llegada: Date;
}
