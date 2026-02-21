import { Entity, PrimaryColumn, Column } from 'typeorm';
import { DispatchStatus } from '../../domain/entity/dispatch-domain-entity';

@Entity('despacho')
export class DispatchOrmEntity {
  @PrimaryColumn({ name: 'id_despacho', type: 'int' })
  id_despacho: number;

  @Column({ name: 'id_venta_ref' })
  id_venta_ref: number;

  @Column({ name: 'tipo_envio', type: 'varchar', length: 50 })
  tipo_envio: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: DispatchStatus,
    default: DispatchStatus.CREADO,
  })
  estado: DispatchStatus;

  @Column({ name: 'fecha_envio', type: 'timestamp' })
  fecha_envio: Date;
}
