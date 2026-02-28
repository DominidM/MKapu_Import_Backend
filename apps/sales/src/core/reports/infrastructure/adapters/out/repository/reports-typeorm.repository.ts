/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ReceiptStatusOrm,
  SalesReceiptOrmEntity,
} from 'apps/sales/src/core/sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { CustomerOrmEntity } from 'apps/sales/src/core/customer/infrastructure/entity/customer-orm.entity';
import { ProductOrmEntity } from 'apps/logistics/src/core/catalog/product/infrastructure/entity/product-orm.entity';
import { IReportsRepositoryPort } from '../../../../domain/ports/out/reports-repository.port';
import { GetSalesReportDto } from '../../../../application/dto/in/get-sales-report.dto';
import { SalesReportRow } from '../../../../domain/entity/sales-report-row.entity';
import { PaymentOrmEntity } from 'apps/sales/src/core/sales-receipt/infrastructure/entity/payment-orm.entity';
import { PaymentTypeOrmEntity } from 'apps/sales/src/core/sales-receipt/infrastructure/entity/payment-type-orm.entity';
import { GetDashboardFilterDto } from '../../../../application/dto/in/get-dashboard-filter.dto';

@Injectable()
export class ReportsTypeOrmRepository implements IReportsRepositoryPort {
  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly salesReceiptRepository: Repository<SalesReceiptOrmEntity>,
    @InjectRepository(CustomerOrmEntity)
    private readonly customerRepository: Repository<CustomerOrmEntity>,
  ) {}
  async getSalesDashboard(filters: any): Promise<SalesReportRow[]> {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    const query = this.salesReceiptRepository
      .createQueryBuilder('sr')
      .leftJoin('sr.cliente', 'c')
      .select([
        'sr.id_comprobante as idComprobante',
        'sr.serie as serie',
        'sr.numero as numero',
        'sr.fec_emision as fec_emision',
        'sr.total as total',
        'sr.estado as estado',
        'c.nombres as cliente_nombres',
        'c.apellidos as cliente_apellidos',
        'c.razon_social as razon_social',
      ])
      .where('sr.fec_emision BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('sr.fec_emision', 'DESC')
      .limit(10);

    const rawResults = await query.getRawMany();

    return rawResults.map((row) => {
      const clienteNombre = row.razon_social
        ? row.razon_social
        : `${row.cliente_nombres || ''} ${row.cliente_apellidos || ''}`.trim();

      return {
        idComprobante: row.idComprobante,
        serie: row.serie,
        numero: row.numero,
        fechaEmision: row.fec_emision,
        total: parseFloat(row.total),
        clienteNombre: clienteNombre || 'Cliente General',
        estado: row.estado,
      } as unknown as SalesReportRow;
    });
  }
  async getPaymentMethodsData(startDate: Date, endDate: Date): Promise<any[]> {
    // Usamos getRawMany() y nos aseguramos de que el alias sea simple
    return await this.salesReceiptRepository
      .createQueryBuilder('sr')
      .innerJoin(
        PaymentOrmEntity,
        'pago',
        'pago.id_comprobante = sr.id_comprobante',
      )
      .innerJoin(
        PaymentTypeOrmEntity,
        'tipo',
        'tipo.id_tipo_pago = pago.id_tipo_pago',
      )
      /* 🚀 TRUCO: Si 'descripcion' te sale undefined, prueba con 'nombre'. 
         Si no estás seguro, verifica en tu BD (tabla tipo_pago). 
         Aquí forzamos el alias entre comillas invertidas para MySQL.
      */
      .select('tipo.descripcion', 'metodo')
      .addSelect('SUM(pago.monto)', 'total')
      .where('sr.fec_emision BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sr.estado = :estado', { estado: ReceiptStatusOrm.EMITIDO })
      .groupBy('tipo.descripcion')
      .getRawMany();
  }

  // 1. KPIs
  async getKpisData(
    startDate: Date,
    endDate: Date,
    id_sede?: string,
  ): Promise<{ totalVentas: number; totalOrdenes: number }> {
    const query = this.salesReceiptRepository
      .createQueryBuilder('sr')
      .select('SUM(sr.total)', 'totalVentas')
      // Corregido: id_comprobante
      .addSelect('COUNT(sr.id_comprobante)', 'totalOrdenes')
      .where('sr.fec_emision BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      // Corregido: uso del Enum
      .andWhere('sr.estado = :estado', { estado: ReceiptStatusOrm.EMITIDO });

    if (id_sede) {
      // Corregido: id_sede_ref
      query.andWhere('sr.id_sede_ref = :id_sede', { id_sede });
    }

    const result = await query.getRawOne();
    return {
      totalVentas: parseFloat(result.totalVentas || '0'),
      totalOrdenes: parseInt(result.totalOrdenes || '0', 10),
    };
  }

  async getTotalClientes(startDate: Date, endDate: Date): Promise<number> {
    return await this.customerRepository
      .createQueryBuilder('c')
      .where('c.estado = :estado', { estado: 1 })
      .getCount();
  }

  async getSalesChartData(startDate: Date, endDate: Date): Promise<any[]> {
    return await this.salesReceiptRepository
      .createQueryBuilder('sr')
      .select('DATE(sr.fec_emision)', 'fecha')
      .addSelect('SUM(sr.total)', 'total')
      .where('sr.fec_emision BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sr.estado = :estado', { estado: ReceiptStatusOrm.EMITIDO })
      .groupBy('DATE(sr.fec_emision)')
      .orderBy('fecha', 'ASC')
      .getRawMany();
  }

  async getTopSellersData(
    startDate: Date,
    endDate: Date,
    limit: number = 5,
  ): Promise<any[]> {
    const rawQuery = `
      SELECT 
        u.nombres,
        u.ape_pat,
        u.ape_mat,
        s.nombre AS nombre_sede,
        COUNT(sr.id_comprobante) AS totalVentas,
        SUM(sr.total) AS montoTotal
      FROM comprobante_venta sr
      INNER JOIN mkp_administracion.usuario u ON CAST(u.id_usuario AS CHAR) = CAST(sr.id_responsable_ref AS CHAR)
      INNER JOIN mkp_administracion.sede s ON s.id_sede = u.id_sede
      WHERE sr.fec_emision BETWEEN ? AND ? 
        AND sr.estado = ?
      GROUP BY u.id_usuario, s.id_sede
      ORDER BY montoTotal DESC
      LIMIT ?
    `;
    // Eliminamos 'u.url_avatar' porque no existe en tu UserOrmEntity actual
    return await this.salesReceiptRepository.query(rawQuery, [
      startDate,
      endDate,
      ReceiptStatusOrm.EMITIDO,
      limit,
    ]);
  }

  async getSalesByDistrictData(
    startDate: Date,
    endDate: Date,
    limit: number = 5,
  ): Promise<any[]> {
    return await this.salesReceiptRepository
      .createQueryBuilder('sr')
      .innerJoin('sr.cliente', 'c')
      .select('TRIM(SUBSTRING_INDEX(c.direccion, ",", -1))', 'distrito')
      .addSelect('SUM(sr.total)', 'total')
      .where('sr.fec_emision BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sr.estado = :estado', { estado: ReceiptStatusOrm.EMITIDO })
      .groupBy('distrito')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopProductsData(
    startDate: Date,
    endDate: Date,
    limit: number = 5,
  ): Promise<any[]> {
    return await this.salesReceiptRepository
      .createQueryBuilder('sr')
      .innerJoin('sr.details', 'detail')
      .select('detail.descripcion', 'nombre')
      .addSelect('SUM(detail.cantidad)', 'ventas')
      .addSelect('SUM(detail.cantidad * detail.pre_uni)', 'ingresos')
      .where('sr.fec_emision BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sr.estado = :estado', { estado: ReceiptStatusOrm.EMITIDO })
      .groupBy('detail.descripcion')
      .orderBy('ingresos', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getSalesByCategoryData(
    startDate: Date,
    endDate: Date,
    limit: number = 5,
  ): Promise<any[]> {
    const rawQuery = `
      SELECT 
        c.nombre AS categoria, 
        SUM(d.cantidad * d.pre_uni) AS total
      FROM comprobante_venta sr
      INNER JOIN detalle_comprobante d ON d.id_comprobante = sr.id_comprobante
      INNER JOIN mkp_logistica.producto p ON p.codigo = d.cod_prod
      INNER JOIN mkp_logistica.categoria c ON c.id_categoria = p.id_categoria
      WHERE sr.fec_emision BETWEEN ? AND ? 
        AND sr.estado = ?
      GROUP BY c.nombre
      ORDER BY total DESC
      LIMIT ?
    `;

    return await this.salesReceiptRepository.query(rawQuery, [
      startDate,
      endDate,
      ReceiptStatusOrm.EMITIDO,
      limit,
    ]);
  }

  async getSalesByHeadquarterData(
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return await this.salesReceiptRepository
      .createQueryBuilder('sr')
      .select('sr.id_sede_ref', 'sede')
      .addSelect('SUM(sr.total)', 'total')
      .where('sr.fec_emision BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sr.estado = :estado', { estado: ReceiptStatusOrm.EMITIDO })
      .groupBy('sr.id_sede_ref')
      .orderBy('total', 'DESC')
      .getRawMany();
  }
}
