/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ namespace: 'transfers', cors: true })
export class TransferWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected:`);
  }
  handleConnection(client: Socket) {
    const headquartersId = client.handshake.query.headquartersId as string;
    if (headquartersId) {
      void client.join(`sede_${headquartersId}`);
      console.log(
        `Client connected: ${headquartersId} to headquarters ${headquartersId}`,
      );
    }
  }
  notifyNewRequest(destinationHeadquartersId: string, data: any) {
    this.server.to(`sede_${destinationHeadquartersId}`).emit('new_transfer_request', {
      message: 'Tienes una nueva solicitud de transferencia por aprobar',
      transfer: data,
    });
  }
  notifyStatusChange(originHeadquartersId: string, data: any) {
    this.server.to(`sede_${originHeadquartersId}`).emit('transfer_status_updated', {
      message: `La transferencia #${data.id} ha cambiado a estado ${data.status}`,
      transfer: data,
    });
  }
}