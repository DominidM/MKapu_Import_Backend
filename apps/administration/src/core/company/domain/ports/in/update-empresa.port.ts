import { Empresa } from '../../entity/empresa.entity';
import { UpdateEmpresaDto } from '../../../application/dto/in/update-empresa.dto';

export interface UpdateEmpresaPort {
  execute(dto: UpdateEmpresaDto): Promise<Empresa>;
}
export const UPDATE_EMPRESA_USE_CASE = 'UPDATE_EMPRESA_USE_CASE';