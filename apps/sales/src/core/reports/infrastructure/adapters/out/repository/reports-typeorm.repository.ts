/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { IReportsRepositoryPort } from '../../../../domain/ports/out/reports-repository.port';
import { GetSalesReportDto } from '../../../../application/dto/in/get-sales-report.dto';
import { SalesReportRow } from '../../../../domain/entity/sales-report-row.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsTypeOrmRepository implements IReportsRepositoryPort {
  constructor(
    private readonly dataSource: DataSource, // Replace with actual TypeORM repository
  ) {}
  async getSalesDashboard(
    filters: GetSalesReportDto,
  ): Promise<SalesReportRow[]> {
    const { startDate, endDate, sedeId, vendedorId } = filters;
    let whereClause = `WHERE cv.fec_emision BETWEEN ? AND ?`;
    const parameters: any[] = [startDate, endDate];
    if (sedeId) {
      whereClause += ` AND cv.sede_id = ?`;
      parameters.push(sedeId);
    }
    if (vendedorId) {
      whereClause += ` AND cv.vendedor_id = ?`;
      parameters.push(vendedorId);
    }
    if (vendedorId) {
      whereClause += ` AND cv.vendedor_id = ?`;
      parameters.push(vendedorId);
    }
    const query = `
      SELECT 
        cv.id_comprobante,
        cv.serie,
        cv.numero,
        cv.fec_emision,
        cv.total,
        cv.estado,
        cv.cod_moneda,
        tc.descripcion as tipo_comprobante,
        c.nombres as cliente_nombre,
        c.valor_doc as cliente_doc,
        s.nombre as sede_nombre,
        CONCAT(u.nombres, ' ', u.ape_pat) as vendedor_nombre
      FROM mkp_ventas.comprobante_venta cv
      INNER JOIN mkp_ventas.tipo_comprobante tc ON cv.id_tipo_comprobante = tc.id_tipo_comprobante
      INNER JOIN mkp_ventas.cliente c ON cv.id_cliente = c.id_cliente
      -- Cruzamos con Admin DB para nombres descriptivos
      INNER JOIN mkp_administracion.sede s ON cv.id_sede_ref = s.id_sede
      INNER JOIN mkp_administracion.usuario u ON cv.id_responsable_ref = u.id_usuario
      ${whereClause}
      ORDER BY cv.fec_emision DESC
    `;
    const results = await this.dataSource.query(query, parameters);
    return results.map(
      (row: any) =>
        new SalesReportRow(
          row.id_comprobante,
          row.serie,
          row.numero,
          new Date(row.fec_emision),
          row.tipo_comprobante,
          row.cliente_nombre,
          row.cliente_doc,
          row.cod_moneda,
          Number(row.total),
          row.estado,
          row.sede_nombre,
          row.vendedor_nombre,
        ),
    );
  }
}
