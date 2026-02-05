export class CreateWastageDetailDto {
  id_producto: number;
  cod_prod: string;
  desc_prod: string;
  cantidad: number;
  pre_unit: number;
  id_tipo_merma: number;
  observacion?: string;
}

export class CreateWastageDto {
  id_usuario_ref: number;
  id_sede_ref: number;
  id_almacen_ref: number; 
  motivo: string;
  detalles: CreateWastageDetailDto[];
}