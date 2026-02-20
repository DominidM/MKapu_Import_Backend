import { TransferStatus } from '../../../domain/entity/transfer-domain-entity';

export interface TransferCreatorUserResponseDto {
  idUsuario: number;
  usuNom: string;
  apePat: string;
}

export interface TransferListResponseDto {
  id?: number;
  origin: {
    id_sede: string;
    nomSede: string;
  };
  destination: {
    id_sede: string;
    nomSede: string;
  };
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  nomProducto: string;
  creatorUser: TransferCreatorUserResponseDto | null;
}
