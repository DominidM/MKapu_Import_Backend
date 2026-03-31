// src/application/dto/out/receipt-detalle.dto.ts

export interface ReceiptDetalleClienteDto {
  nombre:            string;
  documento:         string;
  tipo_documento?:   string;
  telefono:          string;
  direccion:         string;
}

export interface ReceiptDetalleProductoDto {
  id_prod_ref:  number;
  cod_prod:     string;
  descripcion:  string;
  cantidad:     number;
  pre_uni:      number;
  total:        number;
}

export interface ReceiptDetalleDto {
  id_comprobante:    number;
  numero_completo:   string;
  serie:             string;
  numero:            number;
  tipo_comprobante:  string;
  fec_emision:       string;
  subtotal:          number;
  igv:               number;
  total:             number;
  descuento?:        number;
  metodo_pago:       string;
  cliente:           ReceiptDetalleClienteDto;
  responsable:       { nombre: string; sede: number; nombreSede: string };
  productos:         ReceiptDetalleProductoDto[];
}