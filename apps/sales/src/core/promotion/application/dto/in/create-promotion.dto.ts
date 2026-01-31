/* application/dto/in/create-promotion.dto.ts */
export interface CreatePromotionDto {
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean;
}