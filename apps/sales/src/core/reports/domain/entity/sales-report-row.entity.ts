export class SalesReportRow {
  constructor(
    public readonly idComprobante: number,
    public readonly serie: string,
    public readonly numero: number,
    public readonly fechaEmision: Date,
    public readonly tipoComprobante: string,
    public readonly clienteNombre: string,
    public readonly clienteDoc: string,
    public readonly moneda: string,
    public readonly totalVenta: number,
    public readonly estado: string,
    public readonly sede: string,
    public readonly vendedor: string,
  ) {}
}
