import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { ConversacionParticipanteOrmEntity } from './conversacion-participante.orm-entity';
import { MensajeOrmEntity } from './mensaje.orm-entity';


@Entity('conversacion')
export class ConversacionOrmEntity {
  @PrimaryGeneratedColumn()
  id_conversacion: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @Column({ type: 'enum', enum: ['PRIVADO', 'GRUPAL'], default: 'GRUPAL' })
  tipo: 'PRIVADO' | 'GRUPAL';

  @Column({ nullable: true })
  id_sede: number | null;

  @CreateDateColumn()
  creado_en: Date;

  @OneToMany(() => ConversacionParticipanteOrmEntity, cp => cp.conversacion)
  participantes: ConversacionParticipanteOrmEntity[];

  @OneToMany(() => MensajeOrmEntity, m => m.conversacion)
  mensajes: MensajeOrmEntity[];
}