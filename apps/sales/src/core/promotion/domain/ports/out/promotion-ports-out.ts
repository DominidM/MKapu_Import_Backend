/* marketing/src/core/promotion/domain/ports/out/promotion-ports-out.ts */

import { Promotion } from '../../entity/promotion-domain-entity';

export interface IPromotionRepositoryPort {
  findAll(): Promise<Promotion[]>;
  findById(id: number): Promise<Promotion | null>;
  findActive(): Promise<Promotion[]>;
  save(promotion: Promotion): Promise<Promotion>;
  update(id: number, promotion: Promotion): Promise<Promotion>;
  delete(id: number): Promise<void>;
}