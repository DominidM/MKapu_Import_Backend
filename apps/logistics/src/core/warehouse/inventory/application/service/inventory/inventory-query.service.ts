import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConteoInventarioOrmEntity } from '../../../infrastructure/entity/inventory-count-orm.entity';
import { ListInventoryCountFilterDto } from '../../dto/in/list-inventory-count-filter.dto';
import { IInventoryRepositoryPort } from '../../../domain/ports/out/inventory-movement-ports-out';
import { StockResponseDto } from '../../dto/out/stock-response.dto';
import { InventoryMapper } from '../../mapper/inventory.mapper';
import { UnitsAvailabilityResponseDto } from '../../dto/out/units-availability-response.dto';
import { UnitLockerRepository } from '../../../../transfer/infrastructure/adapters/out/unit-locker.repository';
import { InventoryTypeOrmRepository } from '../../../infrastructure/adapters/out/repository/inventory-typeorm.repository';

@Injectable()
export class InventoryQueryService {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
    @InjectRepository(ConteoInventarioOrmEntity)
    private readonly conteoRepo: Repository<ConteoInventarioOrmEntity>,
    private readonly unitLockerRepository: UnitLockerRepository,
    private readonly inventoryRepository: InventoryTypeOrmRepository,

  ) {}

  async getStock(
    productId: number,
    warehouseId: number,
  ): Promise<StockResponseDto> {
    const stock = await this.repository.findStock(productId, warehouseId);

    if (!stock) {
      throw new NotFoundException(
        `No se encontró stock para el producto ${productId} en el almacén ${warehouseId}`,
      );
    }

    return InventoryMapper.toStockResponseDto(stock);
  }

  async obtenerConteoConDetalles(idConteo: number) {
    const data = await this.conteoRepo.findOne({
      where: { idConteo },
      relations: ['detalles'],
      order: {
        detalles: { idDetalle: 'ASC' },
      },
    });

    if (!data) {
      throw new Error(`No se encontró el conteo con ID ${idConteo}`);
    }

    return data;
  }

  async listarConteosPorSede(filtros: ListInventoryCountFilterDto) {
    const query = this.conteoRepo.createQueryBuilder('conteo');

    query.where('conteo.codSede = :idSede', { idSede: filtros.id_sede });

    if (filtros.fecha_inicio) {
      query.andWhere('DATE(conteo.fechaIni) >= :inicio', {
        inicio: filtros.fecha_inicio,
      });
    }

    if (filtros.fecha_fin) {
      query.andWhere('DATE(conteo.fechaIni) <= :fin', {
        fin: filtros.fecha_fin,
      });
    }

    query.orderBy('conteo.fechaIni', 'DESC');

    const data = await query.getMany();

    return { status: 200, data };
  }
  async getMovementsHistory(filters: any) {
    return await this.inventoryRepository.findAllMovements(filters);
  }

  async getSerializedUnitsAvailability(
    productId: number,
    warehouseId: number,
  ): Promise<UnitsAvailabilityResponseDto> {
    const snapshot = await this.unitLockerRepository.getAvailabilitySnapshot(
      productId,
      warehouseId,
    );

    return {
      productId: snapshot.productId,
      warehouseId: snapshot.warehouseId,
      totalUnits: snapshot.totalUnits,
      availableUnits: snapshot.availableUnits,
      byStatus: snapshot.byStatus,
      sampleAvailableSeries: snapshot.sampleAvailableSeries,
    };
  }


}
