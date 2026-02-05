import { Wastage } from '../../entity/wastage-domain-intity';

export interface IWastageRepositoryPort {
  save(wastage: Wastage): Promise<Wastage>;
  findById(id: number): Promise<Wastage | null>;
  findAll(): Promise<Wastage[]>;
}