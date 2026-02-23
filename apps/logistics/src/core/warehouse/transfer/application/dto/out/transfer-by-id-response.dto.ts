import { TransferStatus } from '../../../domain/entity/transfer-domain-entity';
import { TransferCreatorUserResponseDto } from './transfer-list-response.dto';

export interface TransferByIdProductResponseDto {
  id_producto: number;
  categoria: {
    id_categoria: number;
    nombre: string;
  } | null;
  codigo: string;
  nomProducto: string;
  descripcion: string;
}

export interface TransferByIdItemResponseDto {
  series: string[];
  quantity: number;
  producto: TransferByIdProductResponseDto | null;
}

export interface TransferByIdResponseDto {
  id?: number;
  approveUser: TransferCreatorUserResponseDto | null;
  origin: {
    id_sede: string;
    nomSede: string;
  };
  originWarehouse: {
    id_almacen: number;
    nomAlm: string;
  };
  destination: {
    id_sede: string;
    nomSede: string;
  };
  destinationWarehouse: {
    id_almacen: number;
    nomAlm: string;
  };
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  requestDate: Date;
  items: TransferByIdItemResponseDto[];
  creatorUser: TransferCreatorUserResponseDto | null;
}
