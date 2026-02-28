import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountOrmEntity } from '../../../entity/discount-orm.entity';
import { DiscountDomainEntity } from '../../../../domain/entity/discount-domain-entity';
import { DiscountMapper } from '../../../../application/mapper/discount.mapper';
import { IDiscountRepositoryPort } from '../../../../domain/ports/out/discount-ports-out';

@Injectable()
export class DiscountRepository implements IDiscountRepositoryPort {
  constructor(
    @InjectRepository(DiscountOrmEntity)
    private readonly repository: Repository<DiscountOrmEntity>,
  ) {}

  async findAll(page = 1, limit = 10): Promise<[DiscountDomainEntity[], number]> {
    const [entities, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return [DiscountMapper.toDomainList(entities), total];
  }

  async findById(id: number): Promise<DiscountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id_descuento: id } });
    return entity ? DiscountMapper.toDomain(entity) : null;
  }

  async findActive(): Promise<DiscountDomainEntity[]> {
    const entities = await this.repository.find({ where: { activo: true } });
    return DiscountMapper.toDomainList(entities);
  }

  async save(discount: DiscountDomainEntity): Promise<DiscountDomainEntity> {
    const orm = DiscountMapper.toOrm(discount);
    const saved = await this.repository.save(orm);
    return DiscountMapper.toDomain(saved);
  }

  async update(id: number, discount: DiscountDomainEntity): Promise<DiscountDomainEntity> {
    const orm = DiscountMapper.toOrm(discount);
    await this.repository.update({ id_descuento: id }, {
      nombre: orm.nombre,
      porcentaje: orm.porcentaje,
      activo: orm.activo,
    });
    const entity = await this.repository.findOne({ where: { id_descuento: id } });
    return entity ? DiscountMapper.toDomain(entity) : null;
  }

  async changeStatus(id: number, activo: boolean): Promise<DiscountDomainEntity> {
    await this.repository.update({ id_descuento: id }, { activo });
    const entity = await this.repository.findOne({ where: { id_descuento: id } });
    return entity ? DiscountMapper.toDomain(entity) : null;
  }
}