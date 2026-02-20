export enum DispatchStatus {
  CREADO = 'CREADO',
  PENDIENTE = 'PENDIENTE',
  ENVIADO = 'ENVIADO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export class Dispatch {
  private constructor(
    public readonly id_despacho: number | null,
    public readonly id_venta_ref: number,
    public tipo_envio: string,
    public estado: DispatchStatus,
    public fecha_envio: Date,
  ) {
    this.validate();
  }

  static create(props: {
    id_despacho?: number;
    id_venta_ref: number;
    tipo_envio: string;
    estado?: DispatchStatus;
    fecha_envio: Date;
  }): Dispatch {
    if (!props.id_venta_ref)
      throw new Error('La referencia de venta es obligatoria');
    if (!props.tipo_envio?.trim())
      throw new Error('El tipo de envio es obligatorio');
    if (!props.fecha_envio) throw new Error('La fecha de envio es obligatoria');

    return new Dispatch(
      props.id_despacho ?? null,
      props.id_venta_ref,
      props.tipo_envio,
      props.estado ?? DispatchStatus.CREADO,
      props.fecha_envio,
    );
  }

  private validate(): void {
    if (Number.isNaN(this.fecha_envio.getTime())) {
      throw new Error('La fecha de envio no es valida');
    }
  }
}
