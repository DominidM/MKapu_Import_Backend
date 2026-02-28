import { DiscountDomainEntity } from '../../domain/entity/discount-domain-entity';
import { DiscountOrmEntity } from '../../infrastructure/entity/discount-orm.entity';
import { DiscountDto } from '../dto/out/discount.dto';
import { CreateDiscountDto } from '../dto/in/create-discount.dto';
import { UpdateDiscountDto } from '../dto/in/update-discount.dto';

export class DiscountMapper {

  // Domain → ORM
  static toOrm(domain: DiscountDomainEntity): DiscountOrmEntity {
    const orm = new DiscountOrmEntity();
    orm.id_descuento = domain.idDescuento ?? undefined;
    orm.nombre = domain.nombre;
    orm.porcentaje = domain.porcentaje;
    orm.activo = domain.activo;
    return orm;
  }

  // ORM → Domain
  static toDomain(orm: DiscountOrmEntity): DiscountDomainEntity {
    return DiscountDomainEntity.create({
      idDescuento: orm.id_descuento,
      nombre: orm.nombre,
      porcentaje: Number(orm.porcentaje),
      activo: orm.activo,
    });
  }

  // Domain → DTO OUT
  static toResponseDto(domain: DiscountDomainEntity): DiscountDto {
    return {
      idDescuento: domain.idDescuento,
      nombre: domain.nombre,
      porcentaje: domain.porcentaje,
      activo: domain.activo,
    };
  }

  // ORM[] → Domain[]
  static toDomainList(ormList: DiscountOrmEntity[]): DiscountDomainEntity[] {
    return ormList.map(this.toDomain);
  }

  // Domain[] → DTO OUT[]
  static toDtoList(domainList: DiscountDomainEntity[]): DiscountDto[] {
    return domainList.map(this.toResponseDto);
  }

  // Domain[] → Paged DTO
  static toPagedDto(
    domains: DiscountDomainEntity[],
    total: number,
    page: number,
    limit: number
  ) {
    return {
      data: domains.map(this.toResponseDto),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // DTO IN (create) → Domain
  static toDomainFromCreateDto(dto: CreateDiscountDto): DiscountDomainEntity {
    return DiscountDomainEntity.create({
      nombre: dto.nombre,
      porcentaje: dto.porcentaje,
      activo: true,
    });
  }

  // DTO IN (update) → Domain
  static toDomainFromUpdateDto(existing: DiscountDomainEntity, dto: UpdateDiscountDto): DiscountDomainEntity {
    return DiscountDomainEntity.create({
      idDescuento: existing.idDescuento,
      nombre: dto.nombre ?? existing.nombre,
      porcentaje: dto.porcentaje ?? existing.porcentaje,
      activo: typeof dto.activo === 'boolean' ? dto.activo : existing.activo, 
    });
  }
}