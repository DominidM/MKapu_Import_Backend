export interface PromotionRuleProps {
  idRegla?: number;
  idPromocion: number;
  tipoCondicion: string;
  valorCondicion: string;
}

export class PromotionRuleDomainEntity {
  private constructor(private readonly props: PromotionRuleProps) {}

  static create(props: PromotionRuleProps): PromotionRuleDomainEntity {
    if (!props.tipoCondicion) throw new Error('Tipo condición es requerido');
    if (!props.valorCondicion) throw new Error('Valor condición es requerido');
    return new PromotionRuleDomainEntity(props);
  }

  get idRegla() { return this.props.idRegla; }
  get idPromocion() { return this.props.idPromocion; }
  get tipoCondicion() { return this.props.tipoCondicion; }
  get valorCondicion() { return this.props.valorCondicion; }
}