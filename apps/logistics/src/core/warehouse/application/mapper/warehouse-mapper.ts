import { Warehouse } from '../../domain/entity/warehouse-domain-entity';
import { WarehouseOrmEntity } from '../../infrastructure/entity/warehouse-orm.entity';
import { CreateWarehouseDto } from '../dto/in/create-warehouse.dto';
import { WarehouseResponseDto } from '../dto/out/warehouse-response.dto';
import { WarehouseListResponse } from '../dto/out/warehouse-list-response.dto';

export const WarehouseMapper = {
  fromOrm(entity: WarehouseOrmEntity): Warehouse {
    return new Warehouse(
      entity.id_almacen ?? null,
      entity.codigo,
      entity.nombre ?? null,
      entity.departamento ?? null,
      entity.provincia ?? null,
      entity.ciudad ?? null,
      entity.direccion ?? null,
      entity.telefono ?? null,
      !!entity.activo,
      (entity as any).created_at ?? undefined,
      (entity as any).updated_at ?? undefined,
    );
  },

  toOrm(domain: Warehouse): Partial<WarehouseOrmEntity> {
    return {
      ...(domain.id ? { id_almacen: domain.id } : {}),
      codigo: domain.codigo,
      nombre: domain.nombre ?? null,
      departamento: domain.departamento ?? null,
      provincia: domain.provincia ?? null,
      ciudad: domain.ciudad ?? null,
      direccion: domain.direccion ?? null,
      telefono: domain.telefono ?? null,
      activo: domain.activo,
    };
  },

  fromCreateDto(dto: CreateWarehouseDto): Warehouse {
    return new Warehouse(
      null,
      dto.codigo,
      dto.nombre ?? null,
      dto.departamento ?? null,
      dto.provincia ?? null,
      dto.ciudad ?? null,
      dto.direccion ?? null,
      dto.telefono ?? null,
      dto.activo ?? true,
    );
  },

  toResponseDto(domain: Warehouse): WarehouseResponseDto {
    return {
      id: domain.id ?? 0,
      codigo: domain.codigo,
      nombre: domain.nombre ?? undefined,
      departamento: domain.departamento ?? undefined,
      provincia: domain.provincia ?? undefined,
      ciudad: domain.ciudad ?? undefined,
      direccion: domain.direccion ?? undefined,
      telefono: domain.telefono ?? undefined,
      activo: domain.activo,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  },

  toPaginatedResponse(
    items: WarehouseOrmEntity[],
    total: number,
    page: number,
    pageSize: number,
  ): WarehouseListResponse {
    return {
      warehouses: items.map(WarehouseMapper.fromOrm).map(WarehouseMapper.toResponseDto),
      total,
      page,
      pageSize,
    };
  },
};