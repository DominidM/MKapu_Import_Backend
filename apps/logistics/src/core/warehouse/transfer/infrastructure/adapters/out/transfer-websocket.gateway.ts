import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  TransferGatewayEventPayload,
  TransferGatewayTransferPayload,
} from './transfer-websocket.payload';

@WebSocketGateway({
  namespace: '/transfers',
  cors: {
    origin: '*',
  },
})
export class TransferWebsocketGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  private readonly logger = new Logger(TransferWebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  onModuleInit(): void {
    this.logger.log('Gateway de transferencias inicializado');
  }

  onModuleDestroy(): void {
    this.logger.log('Gateway de transferencias detenido');
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Cliente desconectado de transfers: ${client.id}`);
  }

  handleConnection(client: Socket): void {
    const headquartersId = String(
      client.handshake.query.headquartersId ?? '',
    ).trim();
    if (!headquartersId) {
      this.logger.warn(
        `Cliente ${client.id} conectado sin headquartersId en handshake`,
      );
      return;
    }

    void client.join(this.buildRoom(headquartersId));
    this.logger.debug(
      `Cliente ${client.id} unido a room transfers de sede ${headquartersId}`,
    );
  }

  notifyNewRequest(
    destinationHeadquartersId: string,
    payload: TransferGatewayTransferPayload,
  ): void {
    this.emitToHeadquarters(destinationHeadquartersId, 'new_transfer_request', {
      message: 'Tienes una nueva solicitud de transferencia por aprobar',
      transfer: payload,
      emittedAt: new Date().toISOString(),
    });
  }

  notifyStatusChange(
    headquartersId: string,
    payload: TransferGatewayTransferPayload,
  ): void {
    this.emitToHeadquarters(headquartersId, 'transfer_status_updated', {
      message: `La transferencia #${payload.id} cambio de estado`,
      transfer: payload,
      emittedAt: new Date().toISOString(),
    });
  }

  private emitToHeadquarters(
    headquartersId: string,
    event: string,
    payload: TransferGatewayEventPayload,
  ): void {
    this.server.to(this.buildRoom(headquartersId)).emit(event, payload);
  }

  private buildRoom(headquartersId: string): string {
    return `sede_${String(headquartersId).trim()}`;
  }
}
