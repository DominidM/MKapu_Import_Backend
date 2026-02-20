import { RemissionOrmEntity } from '../../../infrastructure/entity/remission-orm.entity';

export interface RemissionPortOut {
  save(remission: RemissionOrmEntity): Promise<RemissionOrmEntity>;
  findById(id: string): Promise<RemissionOrmEntity | null>;
  findLastBySerie(serie: string): Promise<RemissionOrmEntity | null>;
  findByComprobante(idComprobante: number): Promise<RemissionOrmEntity | null>;
}
