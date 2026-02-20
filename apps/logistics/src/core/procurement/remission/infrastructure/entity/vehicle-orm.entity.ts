import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RemissionOrmEntity } from './remission-orm.entity';

@Entity('vehiculo')
export class VehiculoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_vehiculo' })
  id_vehiculo: number;

  @ManyToOne(() => RemissionOrmEntity)
  @JoinColumn({ name: 'id_guia' })
  guia: RemissionOrmEntity;

  @Column({ name: 'id_guia', type: 'char', length: 36 })
  id_guia: string;

  @Column({ name: 'placa', type: 'varchar', length: 10 })
  placa: string;

  @Column({ name: 'marca', type: 'varchar', length: 50, nullable: true })
  marca: string;

  @Column({
    name: 'config_vehicular',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  config_vehicular: string;

  @Column({ name: 'numero_mtc', type: 'varchar', length: 20, nullable: true })
  numero_mtc: string;
}
