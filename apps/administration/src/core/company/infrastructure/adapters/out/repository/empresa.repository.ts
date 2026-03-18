import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaRepositoryPort } from '../../../../domain/ports/out/empresa.repository.port';
import { Empresa } from '../../../../domain/entity/empresa.entity';
import { EmpresaOrmEntity } from '../../../entity/empresa.orm-entity';

@Injectable()
export class EmpresaRepository implements EmpresaRepositoryPort {
  constructor(
    @InjectRepository(EmpresaOrmEntity)
    private readonly orm: Repository<EmpresaOrmEntity>,
  ) {}

  async findOne(): Promise<Empresa | null> {
    const row = await this.orm.findOne({ where: { id: 1 } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async update(data: Partial<Empresa>): Promise<Empresa> {
    await this.orm.update(1, {
      nombreComercial: data.nombreComercial,
      razonSocial:     data.razonSocial,
      ruc:             data.ruc,
      sitioWeb:        data.sitioWeb,
      direccion:       data.direccion,
      ciudad:          data.ciudad,
      departamento:    data.departamento,
      telefono:        data.telefono,
      email:           data.email,
      logoUrl:         data.logoUrl,
      logoPublicId:    data.logoPublicId,
    });
    return this.findOne() as Promise<Empresa>;
  }

  private toDomain(row: EmpresaOrmEntity): Empresa {
    return new Empresa(
      row.id,
      row.nombreComercial,
      row.razonSocial,
      row.ruc,
      row.sitioWeb,
      row.direccion,
      row.ciudad,
      row.departamento,
      row.telefono,
      row.email,
      row.logoUrl,
      row.logoPublicId,
      row.updatedAt,
    );
  }
}