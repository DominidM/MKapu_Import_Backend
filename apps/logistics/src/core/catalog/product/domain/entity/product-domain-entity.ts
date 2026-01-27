/* ============================================
   DOMAIN LAYER - PRODUCT
   logistics/src/core/catalog/product/domain/entity/product-domain-entity.ts
   ============================================ */

export interface ProductProps {
  id_producto?: number;
  id_categoria: number;
  codigo: string;
  anexo: string;
  descripcion: string;
  pre_compra: number;
  pre_venta: number;
  pre_unit: number;
  pre_may: number;
  pre_caja: number;
  uni_med: string;
  estado?: boolean;
  fec_creacion?: Date;
  fec_actual?: Date;
  
  // Datos relacionados (no persistidos)
  categoriaNombre?: string;
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(props: ProductProps): Product {
    return new Product({
      ...props,
      estado: props.estado ?? true,
      fec_creacion: props.fec_creacion ?? new Date(),
      fec_actual: props.fec_actual ?? new Date(),
    });
  }

  // Getters
  get id_producto() {
    return this.props.id_producto;
  }

  get id_categoria() {
    return this.props.id_categoria;
  }

  get codigo() {
    return this.props.codigo;
  }

  get anexo() {
    return this.props.anexo;
  }

  get descripcion() {
    return this.props.descripcion;
  }

  get pre_compra() {
    return this.props.pre_compra;
  }

  get pre_venta() {
    return this.props.pre_venta;
  }

  get pre_unit() {
    return this.props.pre_unit;
  }

  get pre_may() {
    return this.props.pre_may;
  }

  get pre_caja() {
    return this.props.pre_caja;
  }

  get uni_med() {
    return this.props.uni_med;
  }

  get estado() {
    return this.props.estado;
  }

  get fec_creacion() {
    return this.props.fec_creacion;
  }

  get fec_actual() {
    return this.props.fec_actual;
  }

  get categoriaNombre() {
    return this.props.categoriaNombre;
  }

  // Métodos de negocio
  isActive(): boolean {
    return this.props.estado === true;
  }

  hasProfit(): boolean {
    return this.props.pre_venta > this.props.pre_compra;
  }

  getProfitMargin(): number {
    if (this.props.pre_compra === 0) return 0;
    return ((this.props.pre_venta - this.props.pre_compra) / this.props.pre_compra) * 100;
  }

  getPriceByType(type: 'unit' | 'wholesale' | 'box'): number {
    switch (type) {
      case 'unit':
        return this.props.pre_unit;
      case 'wholesale':
        return this.props.pre_may;
      case 'box':
        return this.props.pre_caja;
      default:
        return this.props.pre_venta;
    }
  }

  updatePrices(prices: {
    pre_compra?: number;
    pre_venta?: number;
    pre_unit?: number;
    pre_may?: number;
    pre_caja?: number;
  }): Product {
    return Product.create({
      ...this.props,
      pre_compra: prices.pre_compra ?? this.props.pre_compra,
      pre_venta: prices.pre_venta ?? this.props.pre_venta,
      pre_unit: prices.pre_unit ?? this.props.pre_unit,
      pre_may: prices.pre_may ?? this.props.pre_may,
      pre_caja: prices.pre_caja ?? this.props.pre_caja,
      fec_actual: new Date(),
    });
  }
}
