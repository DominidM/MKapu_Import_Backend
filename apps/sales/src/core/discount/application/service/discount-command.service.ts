import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDiscountCommandPort } from '../../domain/ports/in/discount-ports-in';
import { IDiscountRepositoryPort } from '../../domain/ports/out/discount-ports-out';
import { DiscountMapper } from '../mapper/discount.mapper';
import { CreateDiscountDto, UpdateDiscountDto } from '../dto/in';
import { DiscountDto } from '../dto/out/discount.dto';

@Injectable()
export class DiscountCommandService implements IDiscountCommandPort {
  constructor(
    @Inject('IDiscountRepositoryPort')
    private readonly repository: IDiscountRepositoryPort,
  ) {}

  async createDiscount(dto: CreateDiscountDto): Promise<DiscountDto> {
    const discount = DiscountMapper.toDomainFromCreateDto(dto);
    const saved = await this.repository.save(discount);
    return DiscountMapper.toResponseDto(saved);
  }

  async updateDiscount(id: number, dto: UpdateDiscountDto): Promise<DiscountDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Descuento con ID ${id} no encontrado`);

    const updatedDomain = DiscountMapper.toDomainFromUpdateDto(existing, dto);
    const result = await this.repository.update(id, updatedDomain);
    return DiscountMapper.toResponseDto(result);
  }

  async changeStatus(id: number, activo: boolean): Promise<DiscountDto> {
    const updated = await this.repository.changeStatus(id, activo);
    return DiscountMapper.toResponseDto(updated);
  }
}