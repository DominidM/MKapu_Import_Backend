/* marketing/src/core/promotion/domain/ports/in/promotion-ports-in.ts */

import { Promotion } from '../../entity/promotion-domain-entity';

// Puerto para comandos (escritura)
export interface IPromotionCommandPort {
  registerPromotion(dto: any): Promise<any>;
  updatePromotion(id: number, dto: any): Promise<any>;
  deletePromotion(id: number): Promise<any>;
}

// Puerto para consultas (lectura)
export interface IPromotionQueryPort {
  listPromotions(): Promise<Promotion[]>;
  getPromotionById(id: number): Promise<Promotion | null>;
  getActivePromotions(): Promise<Promotion[]>;
}