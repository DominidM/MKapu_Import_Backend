import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { WastageDetailOrmEntity } from './wastage-detail.orm.entity';

@Entity('merma')
export class WastageOrmEntity {
  @PrimaryGeneratedColumn()
  id_merma: number;

  @Column()
  id_usuario_ref: number;

  @Column()
  id_sede_ref: number;

  @CreateDateColumn({ 
    type: 'datetime', 
    precision: 6, 
    default: () => 'CURRENT_TIMESTAMP(6)' 
  })
  fec_merma: Date;

  @Column({ type: 'varchar', length: 255 })
  motivo: string;

  @Column({ 
    type: 'bit', 
    width: 1, 
    default: () => "b'1'",
    transformer: { to: (v) => v, from: (v) => (v ? !!v[0] : false) }
  })
  estado: boolean;

  // ESTA COLUMNA DEBE IR AQUÍ PARA COINCIDIR CON TU ÚLTIMA CAPTURA
  @Column()
  id_almacen_ref: number; 

  @OneToMany(() => WastageDetailOrmEntity, (detail) => detail.merma, { cascade: true })
  detalles: WastageDetailOrmEntity[];
}