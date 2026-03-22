import { DiscountAppliedDto } from './promotion.dto';

export class PromotionRuleDetailDto {
  idRegla: number;
  tipoCondicion: string;
  valorCondicion: string;
  nombreCondicion: string;
}

export class PromotionDetailDto {
  idPromocion: number;
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean;
  reglas: PromotionRuleDetailDto[];
  descuentosAplicados: DiscountAppliedDto[];
}
