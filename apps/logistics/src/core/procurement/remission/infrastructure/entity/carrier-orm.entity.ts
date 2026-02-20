import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { RemissionOrmEntity } from './remission-orm.entity';

@Entity('transportista')
export class CarrierOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_transportista' })
  id_transportista: number;

  @Column({ name: 'ruc', type: 'varchar', length: 11 })
  ruc: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 255 })
  razon_social: string;

  @Column({
    name: 'numero_registro_mtc',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  numero_registro_mtc: string;

  @Column({
    name: 'direccion_fiscal',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  direccion_fiscal: string;

  @OneToOne(() => RemissionOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_guia' })
  guia: RemissionOrmEntity;

  @Column({ name: 'id_guia', type: 'char', length: 36 })
  id_guia: string;
}
