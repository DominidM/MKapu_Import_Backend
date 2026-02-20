import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DispatchQueryPortIn } from '../../domain/ports/in/dispatch-ports-in';
import { DispatchDtoOut } from '../dto/out/dispatch-dto-out';
import { DispatchPortOut } from '../../domain/ports/out/dispatch-ports-out';
import { DispatchMapper } from '../mapper/dispatch-mapper';

@Injectable()
export class DispatchQueryService implements DispatchQueryPortIn {
  constructor(
    @Inject('IDispatchRepositoryPortOut')
    private readonly repository: DispatchPortOut,
  ) {}

  async getDispatches(): Promise<DispatchDtoOut[]> {
    const dispatches = await this.repository.getAll();
    return dispatches.map((dispatch) => DispatchMapper.toResponseDto(dispatch));
  }

  async getDispatchById(id: number): Promise<DispatchDtoOut> {
    const dispatch = await this.repository.getById(id);
    if (!dispatch) {
      throw new NotFoundException(`Despacho con ID ${id} no encontrado`);
    }
    return dispatch;
  }
}
