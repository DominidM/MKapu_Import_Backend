
/* ============================================
   sales/src/core/salesreceipt/domain/entity/sunat-currency.ts
   ============================================ */

export interface SunatCurrencyProps {
  codigo: number;  
  descripcion: string;           
}

export class SunatCurrency {
  private constructor(private readonly props: SunatCurrencyProps) {}

  static create(props: SunatCurrencyProps): SunatCurrency {
    return new SunatCurrency(props);
  }

  get codigo(): number {
    return this.props.codigo;
  }

  get descripcion(): string {
    return this.props.descripcion;
  }
}