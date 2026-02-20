import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('ubigeo')
export class UbigeoOrmEntity {
  @PrimaryColumn({ name: 'cod_ubigeo', type: 'char', length: 6 })
  cod_ubigeo: string;
  @Column({ name: 'departamento', type: 'varchar', length: 100 })
  departamento: string;

  @Column({ name: 'provincia', type: 'varchar', length: 100 })
  provincia: string;

  @Column({ name: 'distrito', type: 'varchar', length: 100 })
  destino: string;
}
