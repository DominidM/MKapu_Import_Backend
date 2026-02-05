/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* sales/src/core/warranty/application/mapper/warranty.mapper.ts */

import { Warranty } from '../../domain/entity/warranty-domain';
import { WarrantyDetailOrmEntity } from '../../infrastructure/entity/warranty-detail-orm.entity';
import { WarrantyOrmEntity } from '../../infrastructure/entity/warranty-orm-entity';
import { WarrantyTrackingOrmEntity } from '../../infrastructure/entity/warranty-tracking-orm.entity';
import { RegisterWarrantyDto } from '../dto/in/register-warranty.dto';
import { WarrantyListResponse } from '../dto/out/warranty-list-response.dto';
import { WarrantyResponseDto } from '../dto/out/warranty-response.dto';

export class WarrantyMapper {
  static toDomainEntity(orm: WarrantyOrmEntity): Warranty {
    return Warranty.create({
      id_garantia: orm.id_garantia,
      id_estado_garantia: orm.estado?.id_estado,
      id_comprobante: orm.comprobante?.id_comprobante,
      
      // CONVERSIÓN: De int (BD) a string (Dominio)
      id_usuario_recepcion: String(orm.id_usuario_recepcion || orm.cliente?.id_cliente || ''), 
      
      id_sede_ref: orm.id_sede_ref,
      num_garantia: orm.num_garantia,
      fec_solicitud: orm.fec_solicitud,
      fec_recepcion: orm.fec_recepcion ? new Date(orm.fec_recepcion) : undefined,
      cod_prod: orm.cod_prod,
      prod_nombre: orm.prod_nombre,
      estadoNombre: orm.estado?.descripcion,
      detalles: orm.details?.map((d) => ({
        id_detalle: d.id_detalle,
        tipo_solicitud: d.tipo_solicitud,
        descripcion: d.descripcion,
      })) || [],
      seguimientos: orm.tracking?.map((t) => ({
        id_seguimiento: t.id_seguimiento,
        id_usuario_ref: t.id_usuario_ref,
        fecha: t.fecha,
        estado_anterior: t.estado_anterior,
        estado_nuevo: t.estado_nuevo,
        observacion: t.observacion || '',
      })) || [],
    });
  }

  static toOrmEntity(domain: Warranty): WarrantyOrmEntity {
    const orm = new WarrantyOrmEntity();

    if (domain.id_garantia) orm.id_garantia = domain.id_garantia;

    orm.estado = { id_estado: domain.id_estado_garantia } as any;
    orm.comprobante = { id_comprobante: domain.id_comprobante } as any;
    
    // CONVERSIÓN: De string (Dominio) a number (para cumplir con la BD/ORM)
    orm.id_usuario_recepcion = Number(domain.id_usuario_recepcion);
    orm.cliente = { id_cliente: Number(domain.id_usuario_recepcion) } as any;

    orm.id_sede_ref = domain.id_sede_ref;
    orm.num_garantia = domain.num_garantia;
    orm.fec_solicitud = domain.fec_solicitud;
    
    // Si la BD es varchar(45), enviamos ISO string
    orm.fec_recepcion = domain.fec_recepcion ? domain.fec_recepcion.toISOString() : null;
    
    orm.cod_prod = domain.cod_prod;
    orm.prod_nombre = domain.prod_nombre;

    if (domain.detalles && domain.detalles.length > 0) {
      orm.details = domain.detalles.map((d) => {
        const detail = new WarrantyDetailOrmEntity();
        if (d.id_detalle) detail.id_detalle = d.id_detalle;
        detail.tipo_solicitud = d.tipo_solicitud;
        detail.descripcion = d.descripcion;
        return detail;
      });
    }

    if (domain.seguimientos && domain.seguimientos.length > 0) {
      orm.tracking = domain.seguimientos.map((t) => {
        const track = new WarrantyTrackingOrmEntity();
        if (t.id_seguimiento) track.id_seguimiento = t.id_seguimiento;
        track.id_usuario_ref = t.id_usuario_ref;
        track.fecha = t.fecha;
        track.estado_anterior = t.estado_anterior;
        track.estado_nuevo = t.estado_nuevo;
        track.observacion = t.observacion;
        return track;
      });
    }

    return orm;
  }

  static fromRegisterDto(dto: RegisterWarrantyDto): Warranty {
    return Warranty.create({
      id_comprobante: dto.id_comprobante,
      id_usuario_recepcion: String(dto.id_usuario_recepcion),
      id_sede_ref: dto.id_sede_ref,
      id_estado_garantia: 1,
      fec_solicitud: new Date(),
      cod_prod: dto.cod_prod,
      prod_nombre: dto.prod_nombre,
      num_garantia: dto.num_garantia || `GAR-${Date.now()}`,
      detalles: dto.detalles || [],
      seguimientos: [],
    });
  }

  static toResponseDto(domain: Warranty): WarrantyResponseDto {
    return {
      id_garantia: domain.id_garantia,
      id_comprobante: domain.id_comprobante,
      id_usuario_recepcion: domain.id_usuario_recepcion,
      estado: domain.estadoNombre || 'Desconocido',
      fec_solicitud: domain.fec_solicitud,
      fec_recepcion: domain.fec_recepcion,
      cod_prod: domain.cod_prod,
      prod_nombre: domain.prod_nombre,
      num_garantia: domain.num_garantia,
      detalles: domain.detalles,
      seguimientos: domain.seguimientos,
    };
  }

  static toListResponse(
      warranties: Warranty[],
      total: number,
      page: number,
      limit: number
    ): WarrantyListResponse {
      return {
        data: warranties.map((w) => this.toResponseDto(w)),
        meta: {
          totalItems: Number(total),      // Antes era 'total'
          itemsPerPage: Number(limit),   // Antes era 'limit'
          totalPages: Math.ceil(total / limit), // Antes era 'lastPage'
          currentPage: Number(page),     // Antes era 'page'
        },
      };
  }
}