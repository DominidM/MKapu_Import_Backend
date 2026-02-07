/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ISalesBookRepositoryPort } from '../../../../domain/ports/out/sales-book-repository.port';
import { SalesBookRow } from '../../../../domain/entity/sales-book-row.entity';

@Injectable()
export class SalesBookTypeOrmRepository implements ISalesBookRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  async getSalesBookEntries(
    year: number,
    month: number,
  ): Promise<SalesBookRow[]> {
    // 1. Calcular fechas
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 2. Query SQL Nativo (Ignora problemas de alias de TypeORM)
    const query = `
      SELECT 
        cv.serie, 
        cv.numero, 
        cv.fec_emision, 
        cv.fec_venc, 
        tc.cod_sunat AS tipo_cp_sunat,
        tdi.cod_sunat AS cliente_tipo_doc,
        c.id_cliente AS cliente_num_doc,
        c.nombres AS cliente_nombre,
        cv.cod_moneda, 
        cv.subtotal, 
        cv.igv, 
        cv.total, 
        cv.estado,
        cpe.estado_envio, 
        cpe.hash_cpe
      FROM mkp_ventas.comprobante_venta cv
      INNER JOIN mkp_ventas.tipo_comprobante tc 
        ON tc.id_tipo_comprobante = cv.id_tipo_comprobante
      INNER JOIN mkp_ventas.cliente c 
        ON c.id_cliente = cv.id_cliente
      INNER JOIN mkp_ventas.tipo_documento_identidad tdi 
        ON tdi.id_tipo_documento = c.id_tipo_documento
      LEFT JOIN mkp_ventas.cpe_documento cpe 
        ON cpe.id_comprobante = cv.id_comprobante
      WHERE cv.fec_emision BETWEEN ? AND ?
      ORDER BY cv.fec_emision ASC, cv.serie ASC, cv.numero ASC
    `;

    // 3. Ejecutar Query
    const rawResults = await this.dataSource.query(query, [startDate, endDate]);

    // 4. Mapear Resultados a Entidad de Dominio
    return rawResults.map((row: any) => {
      // Parsear montos (MySQL driver a veces devuelve strings para DECIMAL)
      const baseAmount = parseFloat(row.subtotal) || 0;
      const igvAmount = parseFloat(row.igv) || 0;
      const totalAmount = parseFloat(row.total) || 0;

      return new SalesBookRow(
        `${row.serie}-${row.numero}`, // uniqueId
        `${year}${String(month).padStart(2, '0')}00`, // period
        new Date(row.fec_emision),
        row.fec_venc ? new Date(row.fec_venc) : null,
        row.tipo_cp_sunat,
        row.serie,
        Number(row.numero),
        row.cliente_tipo_doc,
        row.cliente_num_doc,
        row.cliente_nombre,
        row.cod_moneda,
        baseAmount,
        igvAmount,
        totalAmount,
        row.estado, // estado interno
        row.estado_envio || null, // estado sunat (puede ser null por left join)
        row.hash_cpe || null,
      );
    });
  }
}
