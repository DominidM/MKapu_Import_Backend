import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { RemissionOrmEntity } from './remission-orm.entity';

@Entity('conductor')
export class DriverOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_conductor' })
  id_conductor: number;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 20 })
  tipo_documento: string;

  @Column({ name: 'numero_documento', type: 'varchar', length: 15 })
  numero_documento: string;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 255 })
  nombre_completo: string;

  @Column({ name: 'licencia', type: 'varchar', length: 20 })
  licencia: string;

  @Column({ name: 'telefono', type: 'varchar', length: 15, nullable: true })
  telefono: string;

  @OneToOne(() => RemissionOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_guia' })
  guia: RemissionOrmEntity;

  @Column({ name: 'id_guia', type: 'char', length: 36 })
  id_guia: string;
}
