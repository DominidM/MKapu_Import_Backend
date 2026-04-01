import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../../../infrastructure/adapters/out/repository/chat.repository';
import { CrearConversacionPrivadaDto } from '../../dto/in/crear-conversacion-privada.dto';
import { EnviarMensajeDto } from '../../dto/in/enviar-mensaje.dto';
import { MarcarLeidosDto } from '../../dto/in/marcar-leidos.dto';
import { ConversacionResponseDto } from '../../dto/out/conversacion-response.dto';
import { MensajeResponseDto } from '../../dto/out/mensaje-response.dto';

@Injectable()
export class ChatCommandService {
  constructor(private readonly chatRepo: ChatRepository) {}

  crearConversacionPrivada(dto: CrearConversacionPrivadaDto): Promise<ConversacionResponseDto> {
    return this.chatRepo.crearConversacionPrivada(dto);
  }

  enviarMensaje(dto: EnviarMensajeDto): Promise<MensajeResponseDto> {
    return this.chatRepo.enviarMensaje(dto);
  }

  marcarLeidos(dto: MarcarLeidosDto): Promise<void> {
    return this.chatRepo.marcarLeidos(dto);
  }
}