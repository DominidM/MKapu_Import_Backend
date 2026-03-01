export interface DiscountAppliedProps {
  idDescuento?: number;
  monto: number;
  idPromocion: number;
}

export class DiscountAppliedDomainEntity {
  private constructor(private readonly props: DiscountAppliedProps) {}

  static create(props: DiscountAppliedProps): DiscountAppliedDomainEntity {
    if (props.monto < 0) throw new Error('Monto no puede ser negativo');
    return new DiscountAppliedDomainEntity(props);
  }

  get idDescuento() { return this.props.idDescuento; }
  get monto() { return this.props.monto; }
  get idPromocion() { return this.props.idPromocion; }
}