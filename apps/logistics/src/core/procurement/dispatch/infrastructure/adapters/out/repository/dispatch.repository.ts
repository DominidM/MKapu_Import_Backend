import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDispatchOutputPort, FindAllFilters } from '../../../../domain/ports/out/dispatch-output.port';
import { Dispatch } from '../../../../domain/entity/dispatch-domain-entity';
import { DispatchDetail } from '../../../../domain/entity/dispatch-detail-domain-entity';
import { DispatchMapper } from '../../../../application/mapper/dispatch.mapper';
import { DispatchOrmEntity } from '../../../entity/dispatch-orm.entity';
import { DispatchDetailOrmEntity } from '../../../entity/dispatch-detail-orm.entity';

@Injectable()
export class DispatchRepository implements IDispatchOutputPort {
  constructor(
    @InjectRepository(DispatchOrmEntity)
    private readonly dispatchRepo: Repository<DispatchOrmEntity>,
    @InjectRepository(DispatchDetailOrmEntity)
    private readonly detailRepo: Repository<DispatchDetailOrmEntity>,
  ) {}

  async findById(id_despacho: number): Promise<Dispatch | null> {
    const orm = await this.dispatchRepo.findOne({
      where: { id_despacho },
      relations: ['detalles'],
    });
    if (!orm) return null;
    const detalles = (orm.detalles ?? []).map(DispatchMapper.detailToDomain);
    return DispatchMapper.toDomain(orm, detalles);
  }

  async findDetailById(id_detalle_despacho: number): Promise<DispatchDetail | null> {
    const orm = await this.detailRepo.findOne({ where: { id_detalle_despacho } });
    if (!orm) return null;
    return DispatchMapper.detailToDomain(orm);
  }

  async findAll(filters?: FindAllFilters): Promise<{ data: Dispatch[]; total: number }> {
    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 10;

    const qb = this.dispatchRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.detalles', 'det')
      .orderBy('d.id_despacho', 'DESC');

    if (filters?.fechaDesde) {
      const desde = new Date(filters.fechaDesde);
      desde.setHours(0, 0, 0, 0);
      qb.andWhere('d.fecha_creacion >= :desde', { desde });
    }

    if (filters?.fechaHasta) {
      const hasta = new Date(filters.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      qb.andWhere('d.fecha_creacion <= :hasta', { hasta });
    }

    if (filters?.id_sede) {
      qb.andWhere('d.id_almacen_origen = :id_sede', { id_sede: filters.id_sede });
    }

    if (filters?.estado) {
      qb.andWhere('d.estado = :estado', { estado: filters.estado });
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      qb.andWhere(
        '(d.direccion_entrega LIKE :search OR CAST(d.id_venta_ref AS CHAR) LIKE :search)',
        { search: searchTerm }
      );
    }

    const total = await qb.getCount();

    const orms = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = orms.map(orm => {
      const detalles = (orm.detalles ?? []).map(DispatchMapper.detailToDomain);
      return DispatchMapper.toDomain(orm, detalles);
    });

    return { data, total };
  }

  async findByVenta(id_venta_ref: number): Promise<Dispatch[]> {
    const orms = await this.dispatchRepo.find({
      where: { id_venta_ref },
      relations: ['detalles'],
    });
    return orms.map(orm => {
      const detalles = (orm.detalles ?? []).map(DispatchMapper.detailToDomain);
      return DispatchMapper.toDomain(orm, detalles);
    });
  }

  async save(dispatch: Dispatch): Promise<Dispatch> {
    const orm = DispatchMapper.toOrm(dispatch);
    const saved = await this.dispatchRepo.save(orm);
    const detalles = await Promise.all(
      dispatch.detalles.map(d => {
        const detailOrm = DispatchMapper.detailToOrm(d, saved.id_despacho);
        return this.detailRepo.save(detailOrm);
      }),
    );
    const domainDetalles = detalles.map(DispatchMapper.detailToDomain);
    return DispatchMapper.toDomain(saved, domainDetalles);
  }

  async saveDetail(detail: DispatchDetail, id_despacho: number): Promise<DispatchDetail> {
    const orm = DispatchMapper.detailToOrm(detail, id_despacho);
    const saved = await this.detailRepo.save(orm);
    return DispatchMapper.detailToDomain(saved);
  }

  async update(dispatch: Dispatch): Promise<Dispatch> {
    const orm = DispatchMapper.toOrm(dispatch);
    await this.dispatchRepo.save(orm);
    return this.findById(dispatch.id_despacho!) as Promise<Dispatch>;
  }

  async updateDetail(detail: DispatchDetail): Promise<DispatchDetail> {
    const orm = await this.detailRepo.findOne({
      where: { id_detalle_despacho: detail.id_detalle_despacho! },
    });
    if (!orm) throw new Error(`Detalle ${detail.id_detalle_despacho} no encontrado`);
    orm.cantidad_despachada = detail.cantidad_despachada;
    orm.estado = detail.estado;
    const saved = await this.detailRepo.save(orm);
    return DispatchMapper.detailToDomain(saved);
  }
}