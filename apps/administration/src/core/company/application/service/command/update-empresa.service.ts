import { Injectable, Inject } from '@nestjs/common';
import { UpdateEmpresaPort } from '../../../domain/ports/in/update-empresa.port';
import { EmpresaRepositoryPort, EMPRESA_REPOSITORY } from '../../../domain/ports/out/empresa.repository.port';
import { UpdateEmpresaDto } from '../../dto/in/update-empresa.dto';
import { Empresa } from '../../../domain/entity/empresa.entity';
import { EmpresaGateway } from '../../../infrastructure/adapters/in/websocket/empresa.gateway';

@Injectable()
export class UpdateEmpresaService implements UpdateEmpresaPort {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly repo: EmpresaRepositoryPort,
    private readonly gateway: EmpresaGateway,
  ) {}

  async execute(dto: UpdateEmpresaDto): Promise<Empresa> {
    const empresa = await this.repo.update(dto);
    // Broadcast a todos los clientes conectados
    this.gateway.emitEmpresaUpdated(empresa);
    return empresa;
  }
}