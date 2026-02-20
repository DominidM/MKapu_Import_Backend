/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { DispatchPortOut } from '../../../../domain/ports/out/dispatch-ports-out';
import { DispatchDtoOut } from '../../../../application/dto/out/dispatch-dto-out';
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
  async update(id: number, dispatch: any) {
    const ormEntity = DispatchMapper.toOrmEntity(dispatch);
    await this.ormRepository.update(dispatch.id_despacho!, ormEntity);
    const updated = await this.ormRepository.findOne({
      where: { id_despacho: dispatch.id_despacho! },
    });
    return DispatchMapper.toDomainEntity(updated);
  }
  async getById(id: number): Promise<DispatchDtoOut> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id_despacho: id },
    });
    return ormEntity ? DispatchMapper.toDomainEntity(ormEntity) : null;
  }
  async getAll(filters?: {
    estado?: string;
    id_almacen?: number;
    id_usuario?: number;
  }): Promise<Dispatch[]> {
    const queryBuilder = this.ormRepository.createQueryBuilder('despacho');

    if (filters?.estado) {
      queryBuilder.andWhere('despacho.estado = :estado', {
        estado: filters.estado,
      });
    }

    if (filters?.id_almacen) {
      queryBuilder.andWhere('despacho.id_almacen_origen = :almacen', {
        almacen: filters.id_almacen,
      });
    }

    if (filters?.id_usuario) {
      queryBuilder.andWhere('despacho.id_usuario_ref = :usuario', {
        usuario: filters.id_usuario,
      });
    }

    queryBuilder.orderBy('despacho.fecha_creacion', 'DESC');

    const results = await queryBuilder.getMany();
    return results.map((orm) => DispatchMapper.toDomainEntity(orm));
  }
  async delete(id: number): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
