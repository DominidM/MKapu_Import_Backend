import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ConversacionOrmEntity } from './conversacion.orm-entity';

@Entity('mensaje')
export class MensajeOrmEntity {
  @PrimaryGeneratedColumn()
  id_mensaje: number;

  @Column()
  id_conversacion: number;

  @Column()
  id_cuenta: number;

  @Column({ type: 'text' })
  contenido: string;

  @CreateDateColumn()
  enviado_en: Date;

  @Column({ type: 'bit', width: 1, default: () => "b'0'" })
  leido: boolean;

  @ManyToOne(() => ConversacionOrmEntity, c => c.mensajes)
  @JoinColumn({ name: 'id_conversacion' })
  conversacion: ConversacionOrmEntity;
}