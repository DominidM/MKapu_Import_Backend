import { QuoteDetail } from "./quote-datail-domain-entity";

export type QuoteStatus = 'PENDIENTE' | 'APROBADA' | 'VENCIDA';

export class Quote {
    public details: QuoteDetail[] = [];

  constructor(
    public readonly id_cotizacion: number | null, // null si es nueva
    public readonly id_cliente: string,
    public subtotal: number,
    public igv: number,
    public total: number,
    public estado: QuoteStatus = 'PENDIENTE',
    public readonly fec_emision: Date = new Date(),
    public fec_venc: Date = new Date(),
    public activo: boolean = true,
    details: QuoteDetail[] = []
  ) {
    this.details = details;
    this.validarMontos();
    this.validarFechas();
    this.validarEstadoInicial();
  }

  // Lógica de negocio: Aprobar cotización
  aprobar(): void {
    if (this.estaVencida()) {
      throw new Error('No se puede aprobar una cotización vencida');
    }
    if (this.estado === 'APROBADA') {
      throw new Error('La cotización ya fue aprobada');
    }
    if (!this.activo) {
      throw new Error('No se puede aprobar una cotización inactiva');
    }
    this.estado = 'APROBADA';
  }

  // Lógica para marcar como vencida
  vencer(): void {
    if (!this.estaVencida()) {
      throw new Error('Solo cotizaciones expiradas pueden marcarse como vencidas');
    }
    this.estado = 'VENCIDA';
  }

  estaVencida(): boolean {
    return new Date() > this.fec_venc;
  }

  esAprobada(): boolean {
    return this.estado === 'APROBADA';
  }

  esPendiente(): boolean {
    return this.estado === 'PENDIENTE';
  }

  esVencida(): boolean {
    return this.estado === 'VENCIDA';
  }

  // Validación de montos
  private validarMontos(): void {
    if (this.subtotal < 0) throw new Error('El subtotal no puede ser negativo');
    if (this.igv < 0) throw new Error('El IGV no puede ser negativo');
    if (this.total < 0) throw new Error('El total no puede ser negativo');
    if (Math.abs((this.subtotal + this.igv) - this.total) > 0.01) {
      throw new Error('La suma de subtotal e IGV debe ser igual al total');
    }
  }

  // Validación de fechas
  private validarFechas(): void {
    if (this.fec_emision > this.fec_venc) {
      throw new Error('La fecha de emisión no puede ser mayor o igual a la fecha de vencimiento');
    }
  }

  // Validación de estado inicial
  private validarEstadoInicial(): void {
    if (!['PENDIENTE', 'APROBADA', 'VENCIDA'].includes(this.estado)) {
      throw new Error('Estado de cotización no válido');
    }
  }

  // Activar/desactivar
  desactivar(): void {
    this.activo = false;
  }
  activar(): void {
    this.activo = true;
  }

  // Validación para modificar montos/fechas solo si está pendiente
  setMontos(subtotal: number, igv: number, total: number): void {
    if (!this.esPendiente()) throw new Error('Solo puede modificar montos en estado PENDIENTE');
    this.subtotal = subtotal;
    this.igv = igv;
    this.total = total;
    this.validarMontos();
  }

  setFechaVencimiento(nuevaFecha: Date): void {
    if (!this.esPendiente()) throw new Error('Solo puede cambiar la fecha de vencimiento en estado PENDIENTE');
    this.fec_venc = nuevaFecha;
    this.validarFechas();
  }
}