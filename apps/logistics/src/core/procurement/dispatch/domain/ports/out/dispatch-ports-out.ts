import { DispatchDtoOut } from '../../../application/dto/out/dispatch-dto-out';
import { Dispatch } from '../../entity/dispatch-domain-entity';

export interface DispatchPortOut {
  save(dto: Dispatch): Promise<Dispatch>;
  update(id: number, dispatch: any);
  getById(id: number): Promise<DispatchDtoOut>;
  getAll(): Promise<Dispatch[]>;
  delete(id: number): Promise<void>;
}
