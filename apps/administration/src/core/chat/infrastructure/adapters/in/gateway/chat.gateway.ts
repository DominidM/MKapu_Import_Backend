import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EnviarMensajeDto } from '../../../../application/dto/in/enviar-mensaje.dto';
import { MarcarLeidosDto } from '../../../../application/dto/in/marcar-leidos.dto';
import { MensajeResponseDto } from '../../../../application/dto/out/mensaje-response.dto';
import { ChatCommandService } from '../../../../application/service/command/chat-command.service';


@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatCommandService: ChatCommandService) {}

  // ── Conexión / Desconexión ────────────────────────────
  handleConnection(client: Socket) {
    console.log(`[Chat] Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Chat] Cliente desconectado: ${client.id}`);
  }

  // ── Unirse a sala de conversación ─────────────────────
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { id_conversacion: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversacion_${data.id_conversacion}`;
    client.join(room);
    client.emit('joined', { room });
  }

  // ── Salir de sala ─────────────────────────────────────
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { id_conversacion: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversacion_${data.id_conversacion}`;
    client.leave(room);
  }

  // ── Enviar mensaje ────────────────────────────────────
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() dto: EnviarMensajeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const mensaje: MensajeResponseDto =
      await this.chatCommandService.enviarMensaje(dto);

    const room = `conversacion_${dto.id_conversacion}`;

    // Emitir a todos en la sala (incluido el emisor)
    this.server.to(room).emit('new_message', mensaje);

    // Notificar badge de no leídos a todos en la sala
    this.server.to(room).emit('update_no_leidos', {
      id_conversacion: dto.id_conversacion,
    });

    return mensaje; // ACK al emisor
  }

  // ── Marcar leídos ─────────────────────────────────────
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() dto: MarcarLeidosDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatCommandService.marcarLeidos(dto);

    const room = `conversacion_${dto.id_conversacion}`;

    // Notificar a la sala que los mensajes fueron leídos
    this.server.to(room).emit('messages_read', {
      id_conversacion: dto.id_conversacion,
      id_cuenta:       dto.id_cuenta,
    });
  }

  // ── Método público para emitir desde el Controller ────
  emitNuevoMensaje(mensaje: MensajeResponseDto) {
    const room = `conversacion_${mensaje.id_conversacion}`;
    this.server.to(room).emit('new_message', mensaje);
  }
}