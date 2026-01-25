import { UnitStatus } from '../../../domain/entity/unit-domain-intity';

export interface UpdateUnitDto {
  warehouseId?: number;
  status?: UnitStatus;
  expirationDate?: Date;
}
