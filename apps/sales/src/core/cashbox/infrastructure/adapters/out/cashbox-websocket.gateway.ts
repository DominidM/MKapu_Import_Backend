  /* ============================================
    administration/src/core/cashbox/infrastructure/adapters/cashbox-websocket.gateway.ts
    ============================================ */
  import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Inject, Injectable } from '@nestjs/common';
  import { ICashboxQueryPort } from '../../../domain/ports/in/cashbox-ports-in';
  import { CashboxResponseDto } from '../../../application/dto/out';

@WebSocketGateway({
  namespace: '/cashbox',
  cors: { origin: '*' },
})
@Injectable()
export class CashboxWebSocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('ICashboxQueryPort')
    private readonly cashboxQueryService: ICashboxQueryPort,
  ) {}

  handleConnection(client: Socket) {
    console.log(`💰 Cliente conectado a Cashbox Control: ${client.id}`);
  }

  @SubscribeMessage('checkActiveSession')
  async handleCheckActiveSession(
    @MessageBody() data: { id_sede: number },
    @ConnectedSocket() client: Socket,
  ): Promise<CashboxResponseDto | { active: boolean }> {
    try {
      const activeBox = await this.cashboxQueryService.findActiveBySede(data.id_sede);
      return activeBox ? activeBox : { active: false };
    } catch (error) {
      client.emit('error', { message: 'Error al consultar sesión activa' });
      throw error;
    }
  }

  notifyCashboxOpened(cashbox: CashboxResponseDto): void {
    this.server.emit('cashbox.opened', cashbox); // << OBJETO CAJA!
  }

  notifyCashboxClosed(cashbox: CashboxResponseDto): void {
    this.server.emit('cashbox.closed', cashbox); // Puede mandar null o el objeto cerrado.
  }
}