/* application/dto/out/promotion.dto.ts */
export class PromotionRuleDto {
  idRegla: number;
  tipoCondicion: string;
  valorCondicion: string;
}

export class DiscountAppliedDto {
  idDescuento: number;
  monto: number;
}

export class PromotionDto {
  idPromocion: number;
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean;
  reglas: PromotionRuleDto[];
  descuentosAplicados: DiscountAppliedDto[];
}