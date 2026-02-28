import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('descuento')
export class DiscountOrmEntity {
  @PrimaryGeneratedColumn()
  id_descuento: number;

  @Column({ length: 45 })
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  porcentaje: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: any) =>
        typeof value === 'number' ? value === 1
        : Array.isArray(value?.data) ? value.data[0] === 1
        : !!value
    }
  })
  activo: boolean;
}