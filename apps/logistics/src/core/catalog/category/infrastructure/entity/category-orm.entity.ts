// category-orm.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const BitToBooleanTransformer = {
  from: (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (Buffer.isBuffer(value)) return value[0] === 1;
    if (value?.type === 'Buffer' && Array.isArray(value?.data)) return value.data[0] === 1;
    return value === 1;
  },
  to: (value: boolean) => value,
};

@Entity('categoria')
export class CategoryOrmEntity {
  @PrimaryGeneratedColumn()
  id_categoria: number;

  @Column({ length: 50 })
  nombre: string;

  @Column({ length: 50 })
  descripcion: string;

  @Column({ type: 'bit', transformer: BitToBooleanTransformer })
  activo: boolean;
}