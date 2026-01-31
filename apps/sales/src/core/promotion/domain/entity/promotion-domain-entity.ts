/* marketing/src/core/promotion/domain/entity/promotion-domain-entity.ts */

export interface PromotionProps {
  idPromocion?: number; // Auto-increment
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean;
}

export class Promotion {
  private constructor(private readonly props: PromotionProps) {}

  static create(props: PromotionProps): Promotion {
    if (props.valor < 0) {
      throw new Error('El valor no puede ser negativo');
    }
    return new Promotion(props);
  }

  static createNew(
    concepto: string,
    tipo: string,
    valor: number,
    activo: boolean = true,
  ): Promotion {
    return Promotion.create({
      concepto,
      tipo,
      valor,
      activo,
    });
  }

  // Getters
  get idPromocion(): number | undefined {
    return this.props.idPromocion;
  }

  get concepto(): string {
    return this.props.concepto;
  }

  get tipo(): string {
    return this.props.tipo;
  }

  get valor(): number {
    return this.props.valor;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  // Métodos de negocio
  isActive(): boolean {
    return this.activo;
  }

  activate(): Promotion {
    return Promotion.create({ ...this.props, activo: true });
  }

  deactivate(): Promotion {
    return Promotion.create({ ...this.props, activo: false });
  }
}