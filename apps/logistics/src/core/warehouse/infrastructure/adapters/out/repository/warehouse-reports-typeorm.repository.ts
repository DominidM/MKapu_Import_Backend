/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { WarehouseReportsPortOut } from '../../../../domain/ports/out/warehouse-reports.port.out';

@Injectable()
export class WarehouseReportsTypeormRepository implements WarehouseReportsPortOut {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getKpiStockStats(sedeId: string | null): Promise<any> {
    let sql = `
      SELECT
        COALESCE(SUM(s.cantidad), 0)                          AS valor_inventario,
        SUM(CASE WHEN s.cantidad <= 10 THEN 1 ELSE 0 END)     AS items_bajo_stock,
        COUNT(*)                                              AS total_items
      FROM stock s
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sedeId) {
      sql += ` AND s.id_sede = ?`;
      params.push(sedeId);
    }

    const rows = await this.entityManager.query(sql, params);
    return rows[0] ?? {};
  }

  async getKpiMovementStats(
    fechaDesde: Date,
    fechaHasta: Date,
    sedeId: string | null,
  ): Promise<any> {
    let sql = `
      SELECT
        COUNT(DISTINCT m.id_movimiento)                             AS total_movimientos,
        SUM(CASE WHEN d.tipo = 'SALIDA' THEN 1 ELSE 0 END)         AS total_salidas
      FROM movimiento_inventario m
      JOIN detalle_movimiento_inventario d ON d.id_movimiento = m.id_movimiento
      JOIN stock s ON s.id_almacen = d.id_almacen
      WHERE m.fecha BETWEEN ? AND ?
    `;
    const params: any[] = [fechaDesde, fechaHasta];

    if (sedeId) {
      sql += ` AND s.id_sede = ?`;
      params.push(sedeId);
    }

    const rows = await this.entityManager.query(sql, params);
    return rows[0] ?? {};
  }

  async getRendimientoStats(
    fechaDesde: Date,
    fechaHasta: Date,
    sedeId: string | null,
    groupExpr: string,
  ): Promise<any[]> {
    let sql = `
      SELECT ${groupExpr} AS label, COUNT(DISTINCT m.id_movimiento) AS cantidad
      FROM movimiento_inventario m
      JOIN detalle_movimiento_inventario d ON d.id_movimiento = m.id_movimiento
      JOIN stock s ON s.id_almacen = d.id_almacen
      WHERE m.fecha BETWEEN ? AND ?
    `;
    const params: any[] = [fechaDesde, fechaHasta];

    if (sedeId) {
      sql += ` AND s.id_sede = ?`;
      params.push(sedeId);
    }

    sql += ` GROUP BY label ORDER BY MIN(m.fecha)`;

    return this.entityManager.query(sql, params);
  }

  async getSaludStockStats(sedeId: string | null): Promise<any> {
    let sql = `
      SELECT
        SUM(CASE WHEN s.cantidad > 20 AND s.cantidad <= 50 THEN 1 ELSE 0 END) AS optimo,
        SUM(CASE WHEN s.cantidad <= 10                     THEN 1 ELSE 0 END) AS bajo_stock,
        SUM(CASE WHEN s.cantidad > 50                      THEN 1 ELSE 0 END) AS sobre_stock
      FROM stock s
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sedeId) {
      sql += ` AND s.id_sede = ?`;
      params.push(sedeId);
    }

    const rows = await this.entityManager.query(sql, params);
    return rows[0] ?? {};
  }

  async getMovimientosRecientesStats(sedeId: string | null): Promise<any[]> {
    let sql = `
      SELECT
        DATE_FORMAT(m.fecha, '%d %b %Y %H:%i') AS fecha,
        m.tipo_origen                           AS tipo,
        CONCAT(m.ref_tabla, ' #', m.ref_id)    AS referencia,
        SUM(d.cantidad)                         AS cantidad,
        'Sistema'                               AS usuario
      FROM movimiento_inventario m
      JOIN detalle_movimiento_inventario d ON d.id_movimiento = m.id_movimiento
      JOIN stock s ON s.id_almacen = d.id_almacen
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sedeId) {
      sql += ` AND s.id_sede = ?`;
      params.push(sedeId);
    }

    sql += ` GROUP BY m.id_movimiento, m.fecha, m.tipo_origen, m.ref_tabla, m.ref_id
             ORDER BY m.fecha DESC
             LIMIT 10`;

    return this.entityManager.query(sql, params);
  }

  async getProductosCriticosStats(sedeId: string | null): Promise<any[]> {
    let sql = `
      SELECT
        dc.cod_prod        AS codigo,
        dc.descripcion     AS descripcion,
        s.cantidad         AS stock,
        COALESCE(dc.stock_sistema, 10) AS stock_minimo,
        COALESCE(
          (SELECT SUM(d2.cantidad) / NULLIF(s.cantidad, 0)
           FROM detalle_movimiento_inventario d2
           JOIN movimiento_inventario m2 ON m2.id_movimiento = d2.id_movimiento
           WHERE d2.id_producto = s.id_producto
             AND d2.id_almacen  = s.id_almacen
             AND d2.tipo        = 'SALIDA'
             AND m2.fecha      >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ), 0
        )                  AS rotacion
      FROM stock s
      JOIN (
        SELECT dc1.id_producto, dc1.id_almacen,
               dc1.cod_prod, dc1.descripcion, dc1.stock_sistema
        FROM detalle_conteo dc1
        INNER JOIN (
          SELECT id_producto, MAX(id_detalle) AS max_id
          FROM detalle_conteo
          GROUP BY id_producto
        ) latest ON latest.id_producto = dc1.id_producto
               AND latest.max_id       = dc1.id_detalle
      ) dc ON dc.id_producto = s.id_producto
           AND dc.id_almacen  = s.id_almacen
      WHERE s.cantidad <= COALESCE(dc.stock_sistema, 10)
    `;
    const params: any[] = [];

    if (sedeId) {
      sql += ` AND s.id_sede = ?`;
      params.push(sedeId);
    }

    sql += ` ORDER BY s.cantidad ASC LIMIT 10`;

    return this.entityManager.query(sql, params);
  }
}
