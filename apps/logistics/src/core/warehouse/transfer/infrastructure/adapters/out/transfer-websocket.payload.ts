export type TransferGatewayHeadquarterPayload = {
  id_sede: string;
  nomSede: string;
};
export type TransferGatewayTransferPayload = {
  id: number;
  status: string;
  requestDate: string | null;
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  totalQuantity: number;
  observation?: string | null;
  nomProducto?: string | null;
  origin?: TransferGatewayHeadquarterPayload;
  destination?: TransferGatewayHeadquarterPayload;
  reason?: string;
};
export type TransferGatewayEventPayload = {
  message: string;
  transfer: TransferGatewayTransferPayload;
  emittedAt: string;
};
