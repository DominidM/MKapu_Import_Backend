import { PromotionDomainEntity } from '../../entity/promotion-domain-entity';

export interface IPromotionRepositoryPort {
  findAll(page?: number, limit?: number): Promise<[PromotionDomainEntity[], number]>; // Devuelve array y total
  findById(id: number): Promise<PromotionDomainEntity | null>;
  findActive(): Promise<PromotionDomainEntity[]>;
  save(promotion: PromotionDomainEntity): Promise<PromotionDomainEntity>;
  update(id: number, promotion: PromotionDomainEntity): Promise<PromotionDomainEntity>;
  delete(id: number): Promise<void>;
  changeStatus(id: number, active: boolean): Promise<PromotionDomainEntity>;
}