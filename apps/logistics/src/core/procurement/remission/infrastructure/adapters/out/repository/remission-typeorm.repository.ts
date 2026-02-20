import { Injectable } from '@nestjs/common';
import { RemissionPortOut } from '../../../../domain/ports/out/remission-port-out';
import {
  RemissionOrmEntity,
  RemissionStatus,
} from '../../../entity/remission-orm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RemissionTypeormRepository implements RemissionPortOut {
  constructor(
    @InjectRepository(RemissionOrmEntity)
    private readonly repository: Repository<RemissionOrmEntity>,
  ) {}
  async save(remission: RemissionOrmEntity): Promise<RemissionOrmEntity> {
    return await this.repository.save(remission);
  }
  async findById(id: string): Promise<RemissionOrmEntity | null> {
    return await this.repository.findOne({
      where: { id_guia: id },
      relations: ['datos_transporte', 'detalles'],
    });
  }
  async findLastBySerie(serie: string): Promise<RemissionOrmEntity | null> {
    const last = await this.repository.find({
      where: { serie },
      order: { numero: 'DESC' },
      take: 1,
    });
    return last.length > 0 ? last[0] : null;
  }
  async findByComprobante(
    idComprobante: number,
  ): Promise<RemissionOrmEntity | null> {
    return await this.repository.findOne({
      where: {
        id_comprobante_ref: idComprobante,
        estado: RemissionStatus.EMITIDO,
      },
    });
  }
}
