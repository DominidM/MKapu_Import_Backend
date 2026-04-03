import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { CrearConversacionPrivadaDto } from '../../../../application/dto/in/crear-conversacion-privada.dto';
import { EnviarMensajeDto } from '../../../../application/dto/in/enviar-mensaje.dto';
import { MarcarLeidosDto } from '../../../../application/dto/in/marcar-leidos.dto';
import { ChatCommandService } from '../../../../application/service/command/chat-command.service';
import { ChatQueryService } from '../../../../application/service/query/chat-query.service';
import { ChatGateway } from '../gateway/chat.gateway';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatQueryService:   ChatQueryService,
    private readonly chatCommandService: ChatCommandService,
    private readonly chatGateway:        ChatGateway,
  ) {}

  // ── GET /chat/conversaciones/:idCuenta ────────────────
  @Get('conversaciones/:idCuenta')
  getMisConversaciones(
    @Param('idCuenta', ParseIntPipe) idCuenta: number,
  ) {
    return this.chatQueryService.getMisConversaciones(idCuenta);
  }

  // ── GET /chat/mensajes/:idConversacion ────────────────
  @Get('mensajes/:idConversacion')
  getMensajes(
    @Param('idConversacion', ParseIntPipe) idConversacion: number,
  ) {
    return this.chatQueryService.getMensajes(idConversacion);
  }

  // ── GET /chat/no-leidos/:idCuenta ─────────────────────
  @Get('no-leidos/:idCuenta')
  getNoLeidos(
    @Param('idCuenta', ParseIntPipe) idCuenta: number,
  ) {
    return this.chatQueryService.getNoLeidos(idCuenta);
  }

  // ── GET /chat/usuarios/:idSede/:idCuenta ──────────────
  @Get('usuarios/:idSede/:idCuenta')
  getUsuariosDisponibles(
    @Param('idSede',   ParseIntPipe) idSede:          number,
    @Param('idCuenta', ParseIntPipe) idCuentaActual:  number,
  ) {
    return this.chatQueryService.getUsuariosDisponibles(idSede, idCuentaActual);
  }

  // ── POST /chat/conversacion ───────────────────────────
  @Post('conversacion')
  async crearConversacionPrivada(
    @Body() dto: CrearConversacionPrivadaDto,
  ) {
    return this.chatCommandService.crearConversacionPrivada(dto);
  }

  // ── POST /chat/mensaje ────────────────────────────────
  @Post('mensaje')
  async enviarMensaje(
    @Body() dto: EnviarMensajeDto,
  ) {
    const mensaje = await this.chatCommandService.enviarMensaje(dto);

    // Emitir por WebSocket a todos en la sala
    this.chatGateway.emitNuevoMensaje(mensaje);

    return mensaje;
  }

  // ── PATCH /chat/leidos ────────────────────────────────
  @Patch('leidos')
  async marcarLeidos(
    @Body() dto: MarcarLeidosDto,
  ) {
    await this.chatCommandService.marcarLeidos(dto);
    return { ok: true };
  }
}