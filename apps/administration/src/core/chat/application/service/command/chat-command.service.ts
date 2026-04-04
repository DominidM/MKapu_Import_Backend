// ─────────────────────────────────────────────────────────
// chat-command.service.ts
// Agrega crearGrupo al servicio de comandos existente
// ─────────────────────────────────────────────────────────
//
// INSTRUCCIÓN: en tu ChatCommandService actual, agrega:
//
//   1. El import del DTO
//   2. El método crearGrupo()
//
// Ejemplo completo del servicio:

import { Injectable, Inject } from '@nestjs/common';
import { CrearConversacionPrivadaDto } from '../../dto/in/crear-conversacion-privada.dto';
import { CrearGrupoDto } from '../../dto/in/crear-grupo.dto';
import { EnviarMensajeDto } from '../../dto/in/enviar-mensaje.dto';
import { MarcarLeidosDto } from '../../dto/in/marcar-leidos.dto';
import { IChatRepositoryPort } from '../../../domain/ports/out/chat-repository-port';

@Injectable()
export class ChatCommandService {
  constructor(
    @Inject('IChatRepositoryPort')
    private readonly chatRepo: IChatRepositoryPort,
  ) {}

  crearConversacionPrivada(dto: CrearConversacionPrivadaDto) {
    return this.chatRepo.crearConversacionPrivada(dto);
  }

  // ── NUEVO ─────────────────────────────────────────────
  crearGrupo(dto: CrearGrupoDto) {
    return this.chatRepo.crearGrupo(dto);
  }

  enviarMensaje(dto: EnviarMensajeDto) {
    return this.chatRepo.enviarMensaje(dto);
  }

  marcarLeidos(dto: MarcarLeidosDto) {
    return this.chatRepo.marcarLeidos(dto);
  }
}