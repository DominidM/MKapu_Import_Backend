import { DiscountDomainEntity } from '../../../domain/entity/discount-domain-entity';

export interface IDiscountRepositoryPort {
  findAll(page?: number, limit?: number): Promise<[DiscountDomainEntity[], number]>;
  findById(id: number): Promise<DiscountDomainEntity | null>;
  findActive(): Promise<DiscountDomainEntity[]>;
  save(discount: DiscountDomainEntity): Promise<DiscountDomainEntity>;
  update(id: number, discount: DiscountDomainEntity): Promise<DiscountDomainEntity>;
  changeStatus(id: number, activo: boolean): Promise<DiscountDomainEntity>;
}