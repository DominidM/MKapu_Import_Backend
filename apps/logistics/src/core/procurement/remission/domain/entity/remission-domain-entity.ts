export enum RemissionType {
  REMITENTE,
  TRANSPORTISTA,
}

export enum TransportMode {
  PUBLICO,
  PRIVADO,
}

export enum RemissionStatus {
  EMITIDO,
  ANULADO,
  PROCESADO,
}

export interface RemissionProps {
  id_guia?: string;
  tipo_guia: RemissionType;
  serie: string;
  numero: number;
  fecha_emision: Date;
  fecha_inicio: Date;
  motivo_traslado: string;
  descripcion?: string;
  peso_total: number;
  unidad_peso: string;
  cantidad: number;
  modalidad: TransportMode;
  estado: RemissionStatus;
  observaciones?: string;

  id_comprobante_ref?: number;
  id_usuario_ref: number;
  id_sede_ref: number;
}

export class Remission {
  private constructor(private readonly props: RemissionProps) {}

  static create(props: RemissionProps): Remission {
    if (props.serie.length !== 4) {
      throw new Error(
        'La serie de la guía debe tener exactamente 4 caracteres',
      );
    }
    if (props.numero <= 0) {
      throw new Error('El número de guía debe ser mayor a 0');
    }
    if (props.peso_total <= 0) {
      throw new Error('El peso total debe ser mayor a 0');
    }
    if (props.fecha_inicio < props.fecha_emision) {
      throw new Error(
        'La fecha de inicio del traslado no puede ser anterior a la emisión',
      );
    }

    return new Remission(props);
  }

  static createNew(
    props: Omit<RemissionProps, 'id_guia' | 'estado' | 'fecha_emision'>,
  ): Remission {
    return Remission.create({
      ...props,
      fecha_emision: new Date(),
      estado: RemissionStatus.EMITIDO,
    });
  }

  // Getters
  get id_guia() {
    return this.props.id_guia;
  }
  get tipo_guia() {
    return this.props.tipo_guia;
  }
  get serie() {
    return this.props.serie;
  }
  get numero() {
    return this.props.numero;
  }
  get fecha_emision() {
    return this.props.fecha_emision;
  }
  get fecha_inicio() {
    return this.props.fecha_inicio;
  }
  get motivo_traslado() {
    return this.props.motivo_traslado;
  }
  get descripcion() {
    return this.props.descripcion;
  }
  get peso_total() {
    return this.props.peso_total;
  }
  get unidad_peso() {
    return this.props.unidad_peso;
  }
  get cantidad() {
    return this.props.cantidad;
  }
  get modalidad() {
    return this.props.modalidad;
  }
  get estado() {
    return this.props.estado;
  }
  get observaciones() {
    return this.props.observaciones;
  }

  get id_comprobante_ref() {
    return this.props.id_comprobante_ref;
  }
  get id_usuario_ref() {
    return this.props.id_usuario_ref;
  }
  get id_sede_ref() {
    return this.props.id_sede_ref;
  }

  isEmitido(): boolean {
    return this.estado === RemissionStatus.EMITIDO;
  }

  isAnulado(): boolean {
    return this.estado === RemissionStatus.ANULADO;
  }

  getFullNumber(): string {
    return `${this.serie}-${this.numero.toString().padStart(8, '0')}`;
  }

  anular(): Remission {
    if (this.isAnulado()) {
      throw new Error('La guía ya se encuentra anulada');
    }
    return Remission.create({
      ...this.props,
      estado: RemissionStatus.ANULADO,
    });
  }

  procesar(): Remission {
    return Remission.create({
      ...this.props,
      estado: RemissionStatus.PROCESADO,
    });
  }
}
