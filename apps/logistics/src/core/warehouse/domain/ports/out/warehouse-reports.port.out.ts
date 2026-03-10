export const WAREHOUSE_REPORTS_PORT_OUT = Symbol('WAREHOUSE_REPORTS_PORT_OUT');

export interface WarehouseReportsPortOut {
  getKpiStockStats(sedeId: string | null): Promise<any>;
  getKpiMovementStats(
    fechaDesde: Date,
    fechaHasta: Date,
    sedeId: string | null,
  ): Promise<any>;
  getRendimientoStats(
    fechaDesde: Date,
    fechaHasta: Date,
    sedeId: string | null,
    groupExpr: string,
  ): Promise<any[]>;
  getSaludStockStats(sedeId: string | null): Promise<any>;
  getMovimientosRecientesStats(sedeId: string | null): Promise<any[]>;
  getProductosCriticosStats(sedeId: string | null): Promise<any[]>;
}
