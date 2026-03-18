import { Injectable, Inject } from '@nestjs/common';
import { GetEmpresaPort } from '../../../domain/ports/in/get-empresa.port';
import { EmpresaRepositoryPort, EMPRESA_REPOSITORY } from '../../../domain/ports/out/empresa.repository.port';
import { Empresa } from '../../../domain/entity/empresa.entity';

@Injectable()
export class GetEmpresaService implements GetEmpresaPort {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly repo: EmpresaRepositoryPort,
  ) {}

  execute(): Promise<Empresa | null> {
    return this.repo.findOne();
  }
}