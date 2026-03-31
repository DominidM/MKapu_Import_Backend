// src/application/dto/out/dispatch-output.dto.ts

export interface ReceiptDetalleProductoDto {
  id_prod_ref:  number;
  cod_prod:     string;
  descripcion:  string;
  cantidad:     number;
  precio_unit:  number;  
  total:        number;
}

export interface DispatchDetailOutputDto {
  id_detalle_despacho: number;
  id_producto:         number;
  cantidad_solicitada: number;
  cantidad_despachada: number;
  estado:              string;
  tieneFaltante:       boolean;
}

export interface DispatchOutputDto {
  id_despacho:       number;
  id_venta_ref:      number;
  id_usuario_ref:    string; 
  id_almacen_origen: number;
  fecha_creacion:    Date;
  fecha_programada?: Date;
  fecha_salida?:     Date;
  fecha_entrega?:    Date;
  direccion_entrega: string;
  observacion?:      string;
  estado:            string;
  tieneFaltantes:    boolean;
  estaActivo:        boolean;
  detalles:          DispatchDetailOutputDto[];
}

export interface EnrichedDispatchDto extends DispatchOutputDto {
  comprobante?:       string;
  tipoComprobante?:   string;
  fechaEmision?:      string;
  subtotal?:          number;
  igv?:               number;
  total?:             number;
  descuento?:         number;
  metodoPago?:        string;
  clienteNombre?:     string;
  clienteDoc?:        string;
  clienteTelefono?:   string;
  clienteDireccion?:  string;
  sedeNombre?:        string;
  responsableNombre?: string;
  productosDetalle?:  ReceiptDetalleProductoDto[];
}