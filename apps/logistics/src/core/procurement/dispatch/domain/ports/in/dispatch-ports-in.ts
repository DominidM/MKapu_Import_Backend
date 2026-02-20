import { CreateDispatchDto } from '../../../application/dto/in/dispatch-dto-in';
import { UpdateDispatchDto } from '../../../application/dto/in/update-dispatch-dto';
import { DispatchDtoOut } from '../../../application/dto/out/dispatch-dto-out';

export interface DispatchCommandPortIn {
  createDispatch(dto: CreateDispatchDto): Promise<DispatchDtoOut>;
  updateDispatch(dto: UpdateDispatchDto);
  deleteDispatch(id: number);
}
export interface DispatchQueryPortIn {
  getDispatches(): Promise<DispatchDtoOut[]>;
  getDispatchById(id: number): Promise<DispatchDtoOut>;
}
