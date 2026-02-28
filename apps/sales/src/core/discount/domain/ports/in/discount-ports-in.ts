import { CreateDiscountDto, UpdateDiscountDto } from '../../../application/dto/in';
import { DiscountDto, DiscountPagedDto } from '../../../application/dto/out';

export interface IDiscountCommandPort {
  createDiscount(dto: CreateDiscountDto): Promise<DiscountDto>;
  updateDiscount(id: number, dto: UpdateDiscountDto): Promise<DiscountDto>;
  changeStatus(id: number, activo: boolean): Promise<DiscountDto>;
}

export interface IDiscountQueryPort {
  listDiscounts(page?: number, limit?: number): Promise<DiscountPagedDto>;
  getDiscountById(id: number): Promise<DiscountDto | null>;
  listActiveDiscounts(): Promise<DiscountDto[]>;
}