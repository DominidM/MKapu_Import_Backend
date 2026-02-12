/* eslint-disable prettier/prettier */
import { Unit, UnitStatus } from "../../entity/unit-domain-entity";

export interface UnitPortsOut {
  save(unit: Unit): Promise<Unit>;

  findById(id: number): Promise<Unit | null>;
  findBySerial(serialNumber: string): Promise<Unit | null>;
  
  findMany(filters: { 
    productId?: number; 
    warehouseId?: number; 
    status?: UnitStatus 
  }): Promise<Unit[]>;

  findBySerials(serialNumbers: string[]): Promise<Unit[]>;

  updateStatus(id: number, status: UnitStatus): Promise<void>;

  updateLocationAndStatusBySerial(serial: string, warehouseId: number, status: UnitStatus): Promise<void>;

  updateLocationAndStatus(id: number, warehouseId: number, status: UnitStatus): Promise<void>;

  updateStatusBySerial(serialNumber: string, status: UnitStatus): Promise<void>;
  
  updateLocationAndStatusBySerial(serialNumber: string, warehouseId: number, status: UnitStatus): Promise<void>;
  updateStatusBySerials(serials: string[], status: UnitStatus): Promise<void>;
}