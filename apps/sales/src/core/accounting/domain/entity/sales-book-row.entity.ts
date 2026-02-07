export class SalesBookRow {
  constructor(
    public readonly uniqueId: string,
    public readonly period: string,
    public readonly issueDate: Date,
    public readonly dueDate: Date | null,
    public readonly receiptTypeSunatCode: string,
    public readonly series: string,
    public readonly number: number,
    public readonly customerIdentityType: string,
    public readonly customerIdentityNumber: string,
    public readonly customerName: string,
    public readonly currencyCode: string,
    public readonly baseAmount: number,
    public readonly igvAmount: number,
    public readonly totalAmount: number,
    public readonly status: string,
    public readonly electronicStatus: string | null,
    public readonly electronicHash: string | null,
  ) {}

  get isValidForAccounting(): boolean {
    return this.status === 'EMITIDO' && this.electronicStatus !== 'OBSERVADO';
  }
}
