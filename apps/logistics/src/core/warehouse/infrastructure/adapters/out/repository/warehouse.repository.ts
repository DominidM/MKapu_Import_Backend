import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { IWarehouseRepository } from '../../../../domain/ports/out/warehouse-ports-out';
import { Warehouse } from '../../../../domain/entity/warehouse-domain-entity';
import { WarehouseOrmEntity } from '../../../entity/warehouse-orm.entity';
import { WarehouseMapper } from '../../../../application/mapper/warehouse-mapper';
import { ListWarehousesFilterDto } from '../../../../application/dto/in/list-warehouses-filter.dto';
import { WarehouseListResponse } from '../../../../application/dto/out/warehouse-list-response.dto';

@Injectable()
export class WarehouseTypeormRepository implements IWarehouseRepository {
  constructor(
    @InjectRepository(WarehouseOrmEntity)
    private readonly repo: Repository<WarehouseOrmEntity>,
  ) {}

  async findPaginated(filters: ListWarehousesFilterDto): Promise<WarehouseListResponse> {
    const { search, activo, page = 1, pageSize = 10 } = filters;

    const qb = this.repo.createQueryBuilder('w');

    if (search) {
      qb.andWhere('(w.nombre LIKE :search OR w.codigo LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (activo !== undefined) {
      qb.andWhere('w.activo = :activo', { activo });
    }

    const [items, total] = await qb
      .skip((Number(page) - 1) * Number(pageSize))
      .take(Number(pageSize))
      .getManyAndCount();

    return WarehouseMapper.toPaginatedResponse(items, total, Number(page), Number(pageSize)); // ✅
  }
  
  async findById(id: number): Promise<Warehouse | null> {
    const e = await this.repo.findOne({ where: { id_almacen: id } });
    return e ? WarehouseMapper.fromOrm(e) : null;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    const e = await this.repo.findOne({ where: { codigo: code } });
    return e ? WarehouseMapper.fromOrm(e) : null;
  }

  async create(w: Warehouse): Promise<Warehouse> {
    const ormPartial: DeepPartial<WarehouseOrmEntity> = WarehouseMapper.toOrm(w) as DeepPartial<WarehouseOrmEntity>;
    const orm = this.repo.create(ormPartial);
    const saved = await this.repo.save(orm);
    return WarehouseMapper.fromOrm(saved);
  }

  async update(id: number, partial: Partial<Warehouse>): Promise<Warehouse> {
    const existing = await this.repo.findOne({ where: { id_almacen: id } });
    if (!existing) throw new Error('Almacén no encontrado');
    const merged = this.repo.merge(existing, partial as any);
    const saved = await this.repo.save(merged);
    return WarehouseMapper.fromOrm(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}