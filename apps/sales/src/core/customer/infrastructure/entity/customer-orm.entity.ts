/* ============================================
   CORRECTED: CustomerOrmEntity matching actual DB table
   sales/src/core/customer/infrastructure/entity/customer-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cliente', schema: 'mkp_ventas' })
export class CustomerOrmEntity {
  @PrimaryColumn({ name: 'id_cliente', type: 'varchar', length: 255 })
  id_cliente: string;

  @Column({ name: 'tipo_doc', type: 'varchar', length: 45, nullable: true })
  tipo_doc: string;

  @Column({ name: 'num_doc', type: 'varchar', length: 45, nullable: true, unique: true })
  num_doc: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 45, nullable: true })
  razon_social?: string;

  @Column({ name: 'nombres', type: 'varchar', length: 45, nullable: true })
  nombres?: string;

  @Column({ name: 'direccion', type: 'varchar', length: 45, nullable: true })
  direccion?: string;

  @Column({ name: 'email', type: 'varchar', length: 45, nullable: true })
  email?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 45, nullable: true })
  telefono?: string;

  @Column({ 
    name: 'estado', 
    type: 'bit', 
    width: 1, 
    default: () => "b'1'",
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: Buffer | number | boolean) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;
        if (Buffer.isBuffer(value)) return value[0] === 1;
        return true;
      }
    }
  })
  estado: boolean;
}
