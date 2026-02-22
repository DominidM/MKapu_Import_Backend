import { EntityManager } from 'typeorm';

export type UnitSeriesRecord = {
  productId: number;
  warehouseId: number;
  serialNumber: string;
  expirationDate: Date;
  status: string;
};

export interface IUnitSeriesRepositoryPort {
  existsBySeries(serial: string, manager?: EntityManager): Promise<boolean>;
  createMany(records: UnitSeriesRecord[], manager?: EntityManager): Promise<void>;
}
