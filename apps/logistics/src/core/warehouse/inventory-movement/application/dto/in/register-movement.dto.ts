import { RegisterMovementItemDto } from './register-movement-item.dto';

export class RegisterMovementDto {
  refId: number;
  refTable: string;
  observation?: string;
  items: RegisterMovementItemDto[];
}
