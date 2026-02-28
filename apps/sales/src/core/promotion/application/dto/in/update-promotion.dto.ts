export class UpdatePromotionDto {
  concepto?: string;
  tipo?: string;
  valor?: number;
  activo?: boolean;
  reglas?: { idRegla?: number; tipoCondicion: string; valorCondicion: string }[];
  descuentosAplicados?: { idDescuento?: number; monto: number }[];
}