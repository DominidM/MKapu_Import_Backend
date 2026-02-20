/* eslint-disable prettier/prettier */
/* apps/logistics/src/core/warehouse/transfer/domain/entity/transfer-domain-entity.ts */

export enum TransferStatus {
  REQUESTED = 'SOLICITADA',
  APPROVED = 'APROBADA',
  REJECTED = 'RECHAZADA',
  COMPLETED = 'COMPLETADA',
}

export class TransferItem {
  productId: number;
  series: string[];
  quantity: number;

  constructor(productId: number, series: string[]) {
    if (!series || series.length === 0) {
      throw new Error('Debe seleccionar al menos una serie para transferir el producto.');
    }
    this.productId = productId;
    this.series = series;
    this.quantity = series.length;
  }
}
export class Transfer {
  id?: number;
  creatorUserId?: number;
  creatorUserName?: string;
  creatorUserLastName?: string;
  
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;

  items: TransferItem[];
  totalQuantity: number;

  status: TransferStatus;
  observation?: string;
  
  requestDate: Date;
  responseDate?: Date;
  completionDate?: Date;

  constructor(
    originHeadquartersId: string,
    originWarehouseId: number,
    destinationHeadquartersId: string,
    destinationWarehouseId: number,
    items: TransferItem[],
    observation?: string,
    id?: number,
    creatorUserId?: number,
    status: TransferStatus = TransferStatus.REQUESTED,
    requestDate: Date = new Date(),
    responseDate?: Date,
    completionDate?: Date,
  ) {
    this.id = id;
    this.creatorUserId = creatorUserId;
    this.originHeadquartersId = originHeadquartersId;
    this.originWarehouseId = originWarehouseId;
    this.destinationHeadquartersId = destinationHeadquartersId;
    this.destinationWarehouseId = destinationWarehouseId;
    this.items = items;
    this.observation = observation;
    this.status = status;
    this.requestDate = requestDate;
    this.responseDate = responseDate;
    this.completionDate = completionDate;

    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  }


  approve(): void {
    if (this.status !== TransferStatus.REQUESTED) {
      throw new Error('Solo se pueden aprobar solicitudes en estado SOLICITADA.');
    }
    this.status = TransferStatus.APPROVED;
    this.responseDate = new Date();
  }

  reject(reason: string): void {
    if (
      this.status !== TransferStatus.REQUESTED &&
      this.status !== TransferStatus.APPROVED
    ) {
      throw new Error(
        'Solo se pueden rechazar solicitudes en estado SOLICITADA o APROBADA.',
      );
    }
    this.status = TransferStatus.REJECTED;
    this.responseDate = new Date();
    this.observation = this.observation 
      ? `${this.observation} | Motivo Rechazo: ${reason}` 
      : `Motivo Rechazo: ${reason}`;
  }

  complete(): void {
    if (this.status !== TransferStatus.APPROVED) {
      throw new Error('Solo se puede confirmar la recepción de transferencias APROBADAS/EN TRANSITO.');
    }
    this.status = TransferStatus.COMPLETED;
    this.completionDate = new Date();
  }
}
