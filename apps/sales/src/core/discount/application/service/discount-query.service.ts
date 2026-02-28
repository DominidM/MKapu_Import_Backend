import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IDiscountQueryPort } from '../../domain/ports/in/discount-ports-in';
import { IDiscountRepositoryPort } from '../../domain/ports/out/discount-ports-out';
import { DiscountMapper } from '../mapper/discount.mapper';
import { DiscountDto, DiscountPagedDto } from '../dto/out';

@Injectable()
export class DiscountQueryService {
  constructor(
    @Inject('IDiscountRepositoryPort')
    private readonly repository: IDiscountRepositoryPort
  ) {}

  async listDiscounts(page = 1, limit = 10): Promise<DiscountPagedDto> {
    const [discounts, total] = await this.repository.findAll(page, limit);
    return DiscountMapper.toPagedDto(discounts, total, page, limit);
  }

  async getDiscountById(id: number): Promise<DiscountDto | null> {
    const discount = await this.repository.findById(id);
    if (!discount) throw new NotFoundException(`Descuento con ID ${id} no encontrado`);
    return DiscountMapper.toResponseDto(discount);
  }

  async listActiveDiscounts(): Promise<DiscountDto[]> {
    const discounts = await this.repository.findActive();
    return DiscountMapper.toDtoList(discounts);
  }
}