/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// core/warehouse/reports/application/service/warehouse-reports-query.service.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  WAREHOUSE_REPORTS_PORT_OUT,
  WarehouseReportsPortOut,
} from '../../domain/ports/out/warehouse-reports.port.out';
import { WarehouseReportsFilterDto } from '../dto/in/warehouse-reports-filter.dto';

@Injectable()
export class WarehouseReportsQueryService {
  constructor(
    @Inject(WAREHOUSE_REPORTS_PORT_OUT)
    private readonly reportsPort: WarehouseReportsPortOut,
  ) {}

  async getKpis(filters: WarehouseReportsFilterDto) {
    const sedeId = filters.sedeId ?? null;
    const { fechaDesde, fechaHasta } = this.getRangoFechas(
      filters.periodo ?? 'mes',
    );

    const sk = await this.reportsPort.getKpiStockStats(sedeId);
    const mv = await this.reportsPort.getKpiMovementStats(
      fechaDesde,
      fechaHasta,
      sedeId,
    );

    const valorInventario = parseFloat(sk.valor_inventario ?? '0');
    const itemsBajoStock = parseInt(sk.items_bajo_stock ?? '0', 10);
    const totalItems = parseInt(sk.total_items ?? '0', 10);
    const totalMov = parseInt(mv.total_movimientos ?? '0', 10);
    const totalSalidas = parseInt(mv.total_salidas ?? '0', 10);

    const exactitudInventario =
      totalItems > 0
        ? parseFloat(
            (((totalItems - itemsBajoStock) / totalItems) * 100).toFixed(1),
          )
        : 100;

    const rotacionPromedio =
      totalMov > 0
        ? parseFloat(((totalSalidas / totalMov) * 12).toFixed(1))
        : 0;

    return {
      valorInventario,
      itemsBajoStock,
      exactitudInventario,
      rotacionPromedio,
      tendencias: {
        valorInventario: '+2.1% vs periodo anterior',
        itemsBajoStock: 'Revisar reposición',
        exactitudInventario: '+0.8 puntos',
        rotacionPromedio: 'Veces por año',
      },
    };
  }

  async getRendimientoChart(filters: WarehouseReportsFilterDto) {
    const periodo = filters.periodo ?? 'mes';
    const sedeId = filters.sedeId ?? null;
    const { fechaDesde, fechaHasta } = this.getRangoFechas(periodo);

    let labels: string[];
    let groupExpr: string;

    if (periodo === 'semana') {
      labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      groupExpr = `DATE_FORMAT(m.fecha, '%a')`;
    } else if (periodo === 'anio') {
      labels = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ];
      groupExpr = `DATE_FORMAT(m.fecha, '%b')`;
    } else {
      labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      groupExpr = `CONCAT('Sem ', CEIL(DAY(m.fecha) / 7))`;
    }

    const rows = await this.reportsPort.getRendimientoStats(
      fechaDesde,
      fechaHasta,
      sedeId,
      groupExpr,
    );

    const datos = labels.map((label) => {
      const row = rows.find((r: any) => r.label?.trim() === label);
      return row ? parseInt(row.cantidad, 10) : 0;
    });

    return { labels, datos };
  }

  async getSaludStock(filters: WarehouseReportsFilterDto) {
    const row = await this.reportsPort.getSaludStockStats(
      filters.sedeId ?? null,
    );
    return {
      optimo: parseInt(row.optimo ?? '0', 10),
      bajoStock: parseInt(row.bajo_stock ?? '0', 10),
      sobreStock: parseInt(row.sobre_stock ?? '0', 10),
    };
  }

  async getMovimientosRecientes(filters: WarehouseReportsFilterDto) {
    const rows = await this.reportsPort.getMovimientosRecientesStats(
      filters.sedeId ?? null,
    );
    return rows.map((r: any) => ({
      fecha: r.fecha,
      tipo: this.mapTipoMovimiento(r.tipo),
      referencia: r.referencia,
      producto: '—',
      cantidad: parseInt(r.cantidad, 10),
      usuario: r.usuario,
    }));
  }

  async getProductosCriticos(filters: WarehouseReportsFilterDto) {
    const rows = await this.reportsPort.getProductosCriticosStats(
      filters.sedeId ?? null,
    );
    return rows.map((r: any) => ({
      codigo: r.codigo,
      descripcion: r.descripcion,
      stock: parseInt(r.stock, 10),
      stockMinimo: parseInt(r.stock_minimo, 10),
      rotacion: parseFloat(r.rotacion ?? '0'),
    }));
  }

  // Helpers internos del caso de uso
  private mapTipoMovimiento(tipo: string): 'INGRESO' | 'SALIDA' | 'AJUSTE' {
    if (tipo === 'COMPRA' || tipo === 'TRANSFERENCIA') return 'INGRESO';
    if (tipo === 'VENTA') return 'SALIDA';
    return 'AJUSTE';
  }

  private getRangoFechas(periodo: string): {
    fechaDesde: Date;
    fechaHasta: Date;
  } {
    const ahora = new Date();
    let fechaDesde: Date;
    switch (periodo) {
      case 'semana':
        fechaDesde = new Date(ahora);
        fechaDesde.setDate(ahora.getDate() - 7);
        break;
      case 'anio':
        fechaDesde = new Date(ahora.getFullYear(), 0, 1);
        break;
      default:
        fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
    }
    return { fechaDesde, fechaHasta: ahora };
  }
}
