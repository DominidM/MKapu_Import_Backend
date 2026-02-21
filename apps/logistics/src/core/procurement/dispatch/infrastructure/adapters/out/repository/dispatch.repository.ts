/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { DispatchPortOut } from '../../../../domain/ports/out/dispatch-ports-out';
import { Dispatch } from '../../../../domain/entity/dispatch-domain-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DispatchOrmEntity } from '../../../entity/dispatch-orm.entity';
import { Repository } from 'typeorm';
import { DispatchMapper } from '../../../../application/mapper/dispatch-mapper';

@Injectable()
export class DispatchRepository implements DispatchPortOut {
  constructor(
    @InjectRepository(DispatchOrmEntity)
    private readonly ormRepository: Repository<DispatchOrmEntity>,
  ) {}
  async save(dto: Dispatch): Promise<Dispatch> {
    const ormEntity = DispatchMapper.toOrmEntity(dto);
    const saved = await this.ormRepository.save(ormEntity);
    return DispatchMapper.toDomainEntity(saved);
  }
  async update(id: number, dispatch: Dispatch): Promise<Dispatch> {
    const ormEntity = DispatchMapper.toOrmEntity(dispatch);
    await this.ormRepository.update(id, ormEntity);
    const updated = await this.ormRepository.findOne({
      where: { id_despacho: id },
    });
    return updated ? DispatchMapper.toDomainEntity(updated) : dispatch;
  }
  async getById(id: number): Promise<Dispatch | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id_despacho: id },
    });
    return ormEntity ? DispatchMapper.toDomainEntity(ormEntity) : null;
  }
  async getAll(filters?: { estado?: string }): Promise<Dispatch[]> {
    const queryBuilder = this.ormRepository.createQueryBuilder('despacho');

    if (filters?.estado) {
      queryBuilder.andWhere('despacho.estado = :estado', {
        estado: filters.estado,
      });
    }

    queryBuilder.orderBy('despacho.fecha_envio', 'DESC');

    const results = await queryBuilder.getMany();
    return results.map((orm) => DispatchMapper.toDomainEntity(orm));
  }
  async delete(id: number): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
