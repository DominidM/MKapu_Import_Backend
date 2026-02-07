/* eslint-disable @typescript-eslint/no-unsafe-return */
/* sales/src/core/warranty/domain/entity/warranty-domain.ts */

export interface WarrantyProps {
  id_garantia?: number;
  id_estado_garantia: number;
  id_comprobante: number;
  id_usuario_recepcion: string;
  id_sede_ref: number;
  num_garantia: string;
  fec_solicitud: Date;
  fec_recepcion?: Date;
  cod_prod: string;
  prod_nombre: string;
  estadoNombre?: string;
  detalles: any[];
  seguimientos: any[];
  observaciones?: string;
}

export class Warranty {
  private props: WarrantyProps;

  private constructor(props: WarrantyProps) {
    this.props = props;
  }

  public static create(props: WarrantyProps): Warranty {
    return new Warranty(props);
  }

  // Getters para el Mapper y Service
  get id_garantia() {
    return this.props.id_garantia;
  }
  get id_estado() {
    return this.props.id_estado_garantia;
  } // Resuelve error Ln 81 y 79
  get id_estado_garantia() {
    return this.props.id_estado_garantia;
  }
  get id_comprobante() {
    return this.props.id_comprobante;
  }
  get id_usuario_recepcion() {
    return this.props.id_usuario_recepcion;
  }
  get id_sede_ref() {
    return this.props.id_sede_ref;
  }
  get num_garantia() {
    return this.props.num_garantia;
  }
  get fec_solicitud() {
    return this.props.fec_solicitud;
  }
  get fec_recepcion() {
    return this.props.fec_recepcion;
  }
  get cod_prod() {
    return this.props.cod_prod;
  }
  get prod_nombre() {
    return this.props.prod_nombre;
  }
  get estadoNombre() {
    return this.props.estadoNombre;
  }
  get detalles() {
    return this.props.detalles;
  }
  get seguimientos() {
    return this.props.seguimientos;
  }

  // MÉTODOS DE NEGOCIO (Resuelven errores Ln 46, 64, 65, 87)
  addTracking(data: {
    id_estado: number;
    comentario: string;
    id_usuario_ref: string;
    fec_registro: Date;
  }) {
    this.props.seguimientos.push({
      estado_nuevo: data.id_estado,
      observacion: data.comentario,
      id_usuario_ref: data.id_usuario_ref,
      fecha: data.fec_registro,
      estado_anterior: this.props.id_estado_garantia,
    });
    this.props.id_estado_garantia = data.id_estado;
  }

  updateObservaciones(obs: string) {
    this.props.observaciones = obs;
  }

  extendWarranty(fecha: Date) {
    this.props.fec_recepcion = fecha;
  }

  // Ajustado para recibir los argumentos que el service envía (image_bea503 Ln 86)
  // Asegúrate de que este método reciba los 3 argumentos (corrije image_bea503 Ln 86)
  changeStatus(nuevoEstado: number, userId: string, motivo: string) {
    this.addTracking({
      id_estado: nuevoEstado,
      comentario: motivo,
      id_usuario_ref: userId,
      fec_registro: new Date(),
    });
    this.props.id_estado_garantia = nuevoEstado;
  }

  // Método que faltaba para corregir Ln 92 (image_c1ed4a)
  registerReception(fecha: Date) {
    this.props.fec_recepcion = fecha;
    // Opcional: Agregar tracking automático de recepción
    this.addTracking({
      id_estado: this.props.id_estado_garantia,
      comentario: 'Producto recibido físicamente',
      id_usuario_ref: 'SISTEMA',
      fec_registro: new Date(),
    });
  }
}
