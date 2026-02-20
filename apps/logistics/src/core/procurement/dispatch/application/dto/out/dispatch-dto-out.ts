import { DispatchStatus } from '../../../domain/entity/dispatch-domain-entity';

export class DispatchDtoOut {
  id_despacho: number;
  id_venta_ref: number;
  id_usuario_ref: number;
  id_almacen_origen: number;
  fecha_creacion: Date;
  fecha_programada: Date;
  fecha_salida: Date | null;
  fecha_entrega: Date | null;
  direccion_entrega: string;
  observacion: string | null;
  estado: DispatchStatus;
}
