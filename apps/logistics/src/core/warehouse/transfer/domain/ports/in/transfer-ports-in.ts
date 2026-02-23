import { ApproveTransferDto } from '../../../application/dto/in/approve-transfer.dto';
import { ConfirmReceiptTransferDto } from '../../../application/dto/in/confirm-receipt-transfer.dto';
import { RejectTransferDto } from '../../../application/dto/in/reject-transfer.dto';
import { RequestTransferDto } from '../../../application/dto/in/request-transfer.dto';
import {
  TransferByIdResponseDto,
  TransferListResponseDto,
  TransferResponseDto,
} from '../../../application/dto/out';

export interface TransferPortsIn {
  requestTransfer(dto: RequestTransferDto): Promise<TransferResponseDto>;

  approveTransfer(
    transferId: number,
    dto: ApproveTransferDto,
  ): Promise<TransferResponseDto>;

  rejectTransfer(
    transferId: number,
    dto: RejectTransferDto,
  ): Promise<TransferResponseDto>;

  confirmReceipt(
    transferId: number,
    dto: ConfirmReceiptTransferDto,
  ): Promise<TransferResponseDto>;

  getTransfersByHeadquarters(
    headquartersId: string,
  ): Promise<TransferResponseDto[]>;

  getTransferById(id: number): Promise<TransferByIdResponseDto>;

  getAllTransfers(): Promise<TransferListResponseDto[]>;
}
