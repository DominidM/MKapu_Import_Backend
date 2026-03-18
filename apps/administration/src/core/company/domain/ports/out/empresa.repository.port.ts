import { Empresa } from '../../entity/empresa.entity';

export interface EmpresaRepositoryPort {
  findOne(): Promise<Empresa | null>;
  update(empresa: Partial<Empresa>): Promise<Empresa>;
}

export const EMPRESA_REPOSITORY = 'EMPRESA_REPOSITORY';