/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DispatchCommandPortIn } from '../../domain/ports/in/dispatch-ports-in';
import { CreateDispatchDto } from '../dto/in/dispatch-dto-in';
import { DispatchDtoOut } from '../dto/out/dispatch-dto-out';
import { DispatchMapper } from '../mapper/dispatch-mapper';
import { DispatchPortOut } from '../../domain/ports/out/dispatch-ports-out';
import { UpdateDispatchDto } from '../dto/in/update-dispatch-dto';

@Injectable()
export class DispatchCommandService implements DispatchCommandPortIn {
  constructor(
    @Inject('IDispatchRepositoryPortOut')
    private readonly repository: DispatchPortOut,
  ) {}
  async createDispatch(dto: CreateDispatchDto): Promise<DispatchDtoOut> {
    const dispatchDomain = DispatchMapper.fromCreateDto(dto);
    const savedDispatch = await this.repository.save(dispatchDomain);
    return DispatchMapper.toResponseDto(savedDispatch);
  }
  async updateDispatch(dto: UpdateDispatchDto) {
    const existingDispatch = await this.repository.getById(dto.id_despacho);
    if (!existingDispatch) {
      throw new NotFoundException(
        `Despacho con ID ${dto.id_despacho} no encontrado`,
      );
    }
    const updatedDomain = DispatchMapper.fromUpdateDto(existingDispatch, dto);
    const result = await this.repository.update(dto.id_despacho, updatedDomain);
    return DispatchMapper.toResponseDto(result);
  }
  async deleteDispatch(id: number) {
    const exists = await this.repository.getById(id);
    if (!exists) {
      throw new NotFoundException(`Despacho con ID ${id} no encontrado`);
    }
    await this.repository.delete(id);
  }
}
