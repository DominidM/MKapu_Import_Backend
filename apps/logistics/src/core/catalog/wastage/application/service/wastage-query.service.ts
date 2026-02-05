import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IWastageRepositoryPort } from '../../domain/ports/out/wastage.port.out';
import { WastageResponseDto } from '../dto/out/wastage-response.dto';
import { WastageMapper } from '../mapper/wastage.mapper';

@Injectable()
export class WastageQueryService {
  constructor(
    @Inject('IWastageRepositoryPort')
    private readonly repository: IWastageRepositoryPort,
  ) {}

  async findAll(): Promise<WastageResponseDto[]> {
    const wastages = await this.repository.findAll();
    return wastages.map(WastageMapper.toResponseDto);
  }

  async findById(id: number): Promise<WastageResponseDto> {
    const wastage = await this.repository.findById(id);
    
    if (!wastage) {
      throw new NotFoundException(`La merma con ID ${id} no existe en el sistema`);
    }
    
    return WastageMapper.toResponseDto(wastage);
  }
}