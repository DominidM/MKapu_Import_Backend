/* eslint-disable prettier/prettier */
import { Transfer, TransferStatus } from "../../entity/transfer-domain-entity";
import { EntityManager } from 'typeorm';

export interface TransferPortsOut {
  save(transfer: Transfer, manager?: EntityManager): Promise<Transfer>;

  findById(id: number): Promise<Transfer | null>;

  updateStatus(id: number, status: TransferStatus): Promise<void>;

  findByHeadquarters(headquartersId: string): Promise<Transfer[]>;

  findAll(): Promise<Transfer[]>;
}
