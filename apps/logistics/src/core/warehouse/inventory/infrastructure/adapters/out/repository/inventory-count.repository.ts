import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConteoInventarioDetalleOrmEntity } from '../../../entity/inventory-count-detail-orm.entity';
import { ConteoInventarioOrmEntity } from '../../../entity/inventory-count-orm.entity';

@Injectable()
export class InventoryCountRepository {
  constructor(
    @InjectRepository(ConteoInventarioOrmEntity)
    private readonly headerRepo: Repository<ConteoInventarioOrmEntity>,
    @InjectRepository(ConteoInventarioDetalleOrmEntity)
    private readonly detailRepo: Repository<ConteoInventarioDetalleOrmEntity>,
  ) {}

  async findHeaderById(idConteo: number) {
    return await this.headerRepo.findOne({
      where: { idConteo },
      relations: ['detalles'],
    });
  }

  async listAllHeadersBySede(codSede: string) {
    return await this.headerRepo.find({
      where: { codSede },
      order: { fechaIni: 'DESC' },
    });
  }

  async findDetailById(idDetalle: number) {
    return await this.detailRepo.findOne({
      where: { idDetalle },
    });
  }
}
