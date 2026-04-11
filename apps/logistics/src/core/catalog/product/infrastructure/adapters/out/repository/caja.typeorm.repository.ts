// infrastructure/repository/caja.typeorm.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICajaRepository } from '../../../../application/dto/out/caja-ports-out';
import { CajaMapper } from '../../../../application/mapper/caja.mapper';
import { Caja } from '../../../../domain/entity/caja-domain-entity';
import { CajaOrmEntity } from '../../../entity/caja-orm-entity';

@Injectable()
export class CajaTypeOrmRepository implements ICajaRepository {
  constructor(
    @InjectRepository(CajaOrmEntity)
    private readonly repo: Repository<CajaOrmEntity>,
  ) {}

  async findById(id_caja: number): Promise<Caja | null> {
    const orm = await this.repo.findOne({
      where: { id_caja },
      relations: ['producto'],
    });
    return orm ? CajaMapper.toDomain(orm) : null;
  }

  async findByProducto(id_producto: number): Promise<Caja[]> {
    const orms = await this.repo.find({
      where: { id_producto },
      relations: ['producto'],
    });
    return orms.map(CajaMapper.toDomain);
  }

  async findByCodigo(cod_caja: string): Promise<Caja | null> {
    const orm = await this.repo.findOne({
      where: { cod_caja },
      relations: ['producto'],
    });
    return orm ? CajaMapper.toDomain(orm) : null;
  }

  async existsByCodigo(cod_caja: string): Promise<boolean> {
    const count = await this.repo.count({ where: { cod_caja } });
    return count > 0;
  }

  async save(caja: Caja): Promise<Caja> {
    const orm   = CajaMapper.toOrm(caja);
    const saved = await this.repo.save(orm);
    return CajaMapper.toDomain(saved);
  }

  async update(caja: Caja): Promise<Caja> {
    const orm   = CajaMapper.toOrm(caja);
    const saved = await this.repo.save(orm);
    return CajaMapper.toDomain(saved);
  }

  async delete(id_caja: number): Promise<void> {
    await this.repo.delete(id_caja);
  }
}