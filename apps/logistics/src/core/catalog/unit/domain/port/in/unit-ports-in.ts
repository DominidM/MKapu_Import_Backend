/* eslint-disable prettier/prettier */
import { Unit, UnitStatus } from "../../entity/unit-domain-entity";
import { CreateUnitDto } from "../../../application/dto/in/create-unit-dto";
import { ChangeUnitStatusDto, UpdateUnitDto } from "../../../application/dto/in/update-unit-dto";

export interface UnitPortsIn {
  createUnit(dto: CreateUnitDto): Promise<Unit>;

  getUnitById(id: number): Promise<Unit>;

  getUnitBySerial(serialNumber: string): Promise<Unit>;

  listUnits(filters: { productId?: number; warehouseId?: number; status?: UnitStatus }): Promise<Unit[]>;

  updateUnit(id: number, dto: UpdateUnitDto): Promise<Unit>;

  discardUnit(id: number, reason: string): Promise<Unit>;
  changeStatus(dto: ChangeUnitStatusDto): Promise<{ message: string }>;
}