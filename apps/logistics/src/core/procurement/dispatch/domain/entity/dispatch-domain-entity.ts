export enum DispatchStatus {
  CREADO = 'CREADO',
  PROGRAMADO = 'PROGRAMADO',
  EN_RUTA = 'EN_RUTA',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export class Dispatch {
  private constructor(
    public readonly id_despacho: number | null,
    public readonly id_venta_ref: number,
    public readonly id_usuario_ref: number,
    public readonly id_almacen_origen: number,
    public readonly fecha_creacion: Date,
    public fecha_programada: Date,
    public fecha_salida: Date | null,
    public fecha_entrega: Date | null,
    public readonly direccion_entrega: string,
    public observacion: string | null,
    public estado: DispatchStatus,
  ) {
    this.validate();
  }

  static create(props: {
    id_despacho?: number;
    id_venta_ref: number;
    id_usuario_ref: number;
    id_almacen_origen: number;
    fecha_creacion?: Date;
    fecha_programada: Date;
    fecha_salida?: Date;
    fecha_entrega?: Date;
    direccion_entrega: string;
    observacion?: string;
    estado?: DispatchStatus;
  }): Dispatch {
    if (!props.id_venta_ref)
      throw new Error('La referencia de venta es obligatoria');
    if (!props.direccion_entrega)
      throw new Error('La dirección de entrega es obligatoria');

    return new Dispatch(
      props.id_despacho ?? null,
      props.id_venta_ref,
      props.id_usuario_ref,
      props.id_almacen_origen,
      props.fecha_creacion ?? new Date(),
      props.fecha_programada,
      props.fecha_salida ?? null,
      props.fecha_entrega ?? null,
      props.direccion_entrega,
      props.observacion ?? null,
      props.estado ?? DispatchStatus.CREADO,
    );
  }

  private validate(): void {
    if (this.estado === DispatchStatus.ENTREGADO && !this.fecha_salida) {
      throw new Error(
        'No se puede marcar como ENTREGADO sin una fecha de salida previa',
      );
    }

    if (this.fecha_programada < this.fecha_creacion) {
      throw new Error(
        'La fecha programada no puede ser anterior a la fecha de creación',
      );
    }
  }

  public markAsInRoute(fechaSalida: Date): void {
    this.estado = DispatchStatus.EN_RUTA;
    this.fecha_salida = fechaSalida;
  }

  public completeDelivery(fechaEntrega: Date): void {
    this.estado = DispatchStatus.ENTREGADO;
    this.fecha_entrega = fechaEntrega;
    this.validate();
  }
}
