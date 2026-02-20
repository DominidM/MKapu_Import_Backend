import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { DispatchStatus } from '../../domain/entity/dispatch-domain-entity';

@Entity('despachos')
export class DispatchOrmEntity {
  @PrimaryGeneratedColumn()
  id_despacho: number;

  @Column({ name: 'id_venta_ref' })
  id_venta_ref: number;

  @Column({ name: 'id_usuario_ref' })
  id_usuario_ref: number;

  @Column({ name: 'id_almacen_origen' })
  id_almacen_origen: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fecha_creacion: Date;

  @Column({ name: 'fecha_programada', type: 'timestamp' })
  fecha_programada: Date;

  @Column({ name: 'fecha_salida', type: 'timestamp', nullable: true })
  fecha_salida: Date | null;

  @Column({ name: 'fecha_entrega', type: 'timestamp', nullable: true })
  fecha_entrega: Date | null;

  @Column({ name: 'direccion_entrega', length: 255 })
  direccion_entrega: string;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion: string | null;

  @Column({
    type: 'enum',
    enum: DispatchStatus,
    default: DispatchStatus.CREADO,
  })
  estado: DispatchStatus;
}
