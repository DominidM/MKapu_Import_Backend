import { PromotionRuleDomainEntity } from './promotion-rule-domain-entity';

export interface PromotionProps {
  idPromocion?: number;
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean;
  reglas?: PromotionRuleDomainEntity[];
  descuentosAplicados?: { idDescuento: number; monto: number }[]; 
}

export class PromotionDomainEntity {
  private constructor(private readonly props: PromotionProps) {}

  static create(props: PromotionProps): PromotionDomainEntity {
    if (props.valor < 0) throw new Error('El valor no puede ser negativo');
    return new PromotionDomainEntity(props);
  }

  get idPromocion() { return this.props.idPromocion; }
  get concepto() { return this.props.concepto; }
  get tipo() { return this.props.tipo; }
  get valor() { return this.props.valor; }
  get activo() { return this.props.activo; }
  get reglas() { return this.props.reglas ?? []; }
  get descuentosAplicados() { return this.props.descuentosAplicados ?? []; }

  activate(): PromotionDomainEntity {
    return PromotionDomainEntity.create({ ...this.props, activo: true });
  }
  deactivate(): PromotionDomainEntity {
    return PromotionDomainEntity.create({ ...this.props, activo: false });
  }
  isActive(): boolean { return this.props.activo; }
}