import { Quote } from "../../domain/entity/quote-domain-entity";
import { QuoteOrmEntity } from "../../infrastructure/entity/quote-orm.entity";
import { QuoteDetailOrmEntity } from "../../infrastructure/entity/quote-orm-detail.entity";
import { QuoteResponseDto, QuoteDetailResponseDto } from "../dto/out/quote-response.dto";
import { QuoteDetail } from '../../domain/entity/quote-datail-domain-entity';

export class QuoteMapper {
  static toOrmEntity(domain: Quote): QuoteOrmEntity {
    const orm = new QuoteOrmEntity();
    orm.id_cliente = domain.id_cliente;

    orm.subtotal = domain.subtotal;
    orm.igv = domain.igv;
    orm.total = domain.total;
    orm.estado = domain.estado;
    orm.fec_emision = domain.fec_emision;
    orm.fec_venc = domain.fec_venc;
    orm.activo = domain.activo;

    orm.detalles = domain.details.map(detail => {
      const detOrm = new QuoteDetailOrmEntity();
      detOrm.id_detalle = detail.id_detalle ?? undefined;
      detOrm.id_prod_ref = detail.id_prod_ref;
      detOrm.cod_prod = detail.cod_prod;
      detOrm.descripcion = detail.descripcion;
      detOrm.cantidad = detail.cantidad;
      detOrm.precio = detail.precio;
      return detOrm;
    });
    return orm;
  }

  static toDomain(orm: QuoteOrmEntity): Quote {
    return new Quote(
      orm.id_cotizacion,
      orm.id_cliente,
      Number(orm.subtotal),
      Number(orm.igv),
      Number(orm.total),
      orm.estado as any,
      orm.fec_emision,
      orm.fec_venc,
      orm.activo,
      (orm.detalles ?? []).map(det =>
        new QuoteDetail(
          det.id_detalle,
          orm.id_cotizacion,
          det.id_prod_ref,
          det.cod_prod,
          det.descripcion,
          det.cantidad,
          det.precio
        )
      )
    );
  }

  static toResponseDto(domain: Quote): QuoteResponseDto {
    return {
      id_cotizacion: domain.id_cotizacion!,
      id_cliente: domain.id_cliente,
      fec_emision: domain.fec_emision,
      fec_venc: domain.fec_venc,
      total: domain.total,
      estado: domain.estado,
      activo: domain.activo,
      detalles: domain.details.map(detail => ({
        id_detalle: detail.id_detalle!,
        id_prod_ref: detail.id_prod_ref,
        cod_prod: detail.cod_prod,
        descripcion: detail.descripcion,
        cantidad: detail.cantidad,
        precio: detail.precio,
        importe: detail.importe // si existe (asegúrate en el domain)
      }))
    };
  }
}