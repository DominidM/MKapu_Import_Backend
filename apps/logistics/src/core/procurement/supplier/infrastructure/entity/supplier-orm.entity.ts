import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'proveedor', schema: 'mkp_logistica' })
export class SupplierOrmEntity {
  @PrimaryColumn({ name: 'id_proveedor', type: 'int' })
  id_proveedor: number;

  @Column({ name: 'razon_social', type: 'varchar', length: 80 })
  razon_social: string;

  @Column({ name: 'ruc', type: 'varchar', length: 11 })
  ruc: string;

  @Column({ name: 'contacto', type: 'varchar', length: 50, nullable: true })
  contacto: string;

  @Column({ name: 'email', type: 'varchar', length: 50, nullable: true })
  email: string;

  @Column({ name: 'telefono', type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ name: 'dir_fiscal', type: 'varchar', length: 100, nullable: true })
  dir_fiscal: string;

  @Column({ 
    name: 'estado', 
    type: 'bit', 
    width: 1,
    transformer: {
      to: (value: boolean): number => (value ? 1 : 0),
      from: (value: any): boolean => {
        if (value === null || value === undefined) return false;
        
        if (Buffer.isBuffer(value)) {
          return value[0] === 1;
        }
        
        if (typeof value === 'number') {
          return value === 1;
        }
        
        return Boolean(value);
      }
    }
  })
  estado: boolean;
}
