import { Transfer } from '../../entity/transfer-domain-entity';

export interface RequestTransferItemDto {
  productId: number;
  series: string[];
}

export interface RequestTransferDto {
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  items: RequestTransferItemDto[];
  observation?: string;
  userId: number;
}

export interface TransferCommandPortIn {
  requestTransfer(dto: RequestTransferDto): Promise<Transfer>;
  approveTransfer(transferId: number, userId: number): Promise<Transfer>;
  confirmReceipt(transferId: number, userId: number): Promise<Transfer>;
  rejectTransfer(
    transferId: number,
    userId: number,
    reason: string,
  ): Promise<Transfer>;
}

// 📌 Interfaz para las Consultas (Lectura)
export interface TransferQueryPortIn {
  getTransfersByHeadquarters(headquartersId: string): Promise<Transfer[]>;
  getTransferById(id: number): Promise<Transfer>;
  getAllTransfers(): Promise<Transfer[]>;
}
