export interface DiscountProps {
  idDescuento?: number;
  nombre: string;
  porcentaje: number;
  activo?: boolean;
}

export class DiscountDomainEntity {
  private constructor(private readonly props: DiscountProps) {}

  static create(props: DiscountProps): DiscountDomainEntity {
    if (props.porcentaje < 0) throw new Error('Porcentaje no puede ser negativo');
    if (props.porcentaje > 100) throw new Error('Porcentaje no puede ser mayor que 100');
    return new DiscountDomainEntity(props);
  }

  get idDescuento() { return this.props.idDescuento; }
  get nombre() { return this.props.nombre; }
  get porcentaje() { return this.props.porcentaje; }
  get activo() { return this.props.activo ?? true; } 
}