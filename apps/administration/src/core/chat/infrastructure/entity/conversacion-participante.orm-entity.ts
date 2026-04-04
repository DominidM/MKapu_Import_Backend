import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ConversacionOrmEntity } from './conversacion.orm-entity';

@Entity('conversacion_participante')
export class ConversacionParticipanteOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  id_conversacion: number;

  @Column()
  id_cuenta: number;

  @CreateDateColumn()
  unido_en: Date;

  @ManyToOne(() => ConversacionOrmEntity, c => c.participantes)
  @JoinColumn({ name: 'id_conversacion' })
  conversacion: ConversacionOrmEntity;
}