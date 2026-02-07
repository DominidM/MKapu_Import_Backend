export class CashboxReportRow {
  constructor(
    public readonly idCaja: string,
    public readonly fechaApertura: Date,
    public readonly fechaCierre: Date | null,
    public readonly estado: string,
    public readonly totalIngresos: number,
    public readonly totalEgresos: number,
    public readonly totalVentasEfectivo: number,
    public readonly saldoFinalCalculado: number,
  ) {}
}
