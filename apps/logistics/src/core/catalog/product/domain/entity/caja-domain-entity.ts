// domain/entity/caja-domain-entity.ts

export interface CajaProps {
  id_caja?:          number;
  id_producto:       number;
  cantidad_unidades: number;
  cod_caja:          string;
  pre_caja:          number;
  pre_mayorista?:    number | null;
  fecha_ingreso?:    Date;
}

export class Caja {
  private constructor(private readonly props: CajaProps) {}

  static create(props: CajaProps): Caja {
    if (!props.id_producto || props.id_producto <= 0)
      throw new Error('El producto es requerido.');

    if (!props.cantidad_unidades || props.cantidad_unidades <= 0)
      throw new Error('La cantidad de unidades por caja debe ser mayor a 0.');

    if (!props.cod_caja || props.cod_caja.trim().length === 0)
      throw new Error('El código de caja es requerido.');

    if (!props.pre_caja || props.pre_caja <= 0)
      throw new Error('El precio de caja debe ser mayor a 0.');

    if (props.pre_mayorista !== undefined && props.pre_mayorista !== null) {
      if (props.pre_mayorista <= 0)
        throw new Error('El precio mayorista debe ser mayor a 0.');
      if (props.pre_mayorista > props.pre_caja)
        throw new Error('El precio mayorista no puede ser mayor al precio de caja.');
    }

    return new Caja(props);
  }

  // ── Getters ───────────────────────────────────────────────────
  get id_caja():           number | undefined { return this.props.id_caja;              }
  get id_producto():       number             { return this.props.id_producto;           }
  get cantidad_unidades(): number             { return this.props.cantidad_unidades;     }
  get cod_caja():          string             { return this.props.cod_caja;              }
  get pre_caja():          number             { return this.props.pre_caja;              }
  get pre_mayorista():     number | null      { return this.props.pre_mayorista ?? null; }
  get fecha_ingreso():     Date | undefined   { return this.props.fecha_ingreso;         }

  // ── Reglas de negocio ─────────────────────────────────────────

  calcularEncajado(stockUnidades: number): { cajas: number; sobrante: number } {
    if (stockUnidades < 0) throw new Error('El stock no puede ser negativo.');
    return {
      cajas:    Math.floor(stockUnidades / this.cantidad_unidades),
      sobrante: stockUnidades % this.cantidad_unidades,
    };
  }

  unidadesParaCajas(numeroCajas: number): number {
    if (numeroCajas <= 0)
      throw new Error('El número de cajas debe ser mayor a 0.');
    return numeroCajas * this.cantidad_unidades;
  }

  puedeArmarCajas(stockUnidades: number, numeroCajas: number): boolean {
    return stockUnidades >= this.unidadesParaCajas(numeroCajas);
  }

  descontarPorVentaCajas(stockUnidades: number, numeroCajas: number): number {
    const necesarias = this.unidadesParaCajas(numeroCajas);
    if (stockUnidades < necesarias)
      throw new Error(
        `Stock insuficiente. Se necesitan ${necesarias} unidades para ${numeroCajas} caja(s) pero solo hay ${stockUnidades}.`,
      );
    return necesarias;
  }

  desencajar(numeroCajas: number): number {
    if (numeroCajas <= 0)
      throw new Error('El número de cajas a desencajar debe ser mayor a 0.');
    return this.unidadesParaCajas(numeroCajas);
  }

  updatePrecios(pre_caja: number, pre_mayorista?: number | null): Caja {
    return Caja.create({
      ...this.props,
      pre_caja,
      pre_mayorista: pre_mayorista ?? this.props.pre_mayorista,
    });
  }
}