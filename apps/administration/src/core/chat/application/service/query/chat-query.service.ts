import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../../../infrastructure/adapters/out/repository/chat.repository';
import { ConversacionResponseDto } from '../../dto/out/conversacion-response.dto';
import { MensajeResponseDto } from '../../dto/out/mensaje-response.dto';

@Injectable()
export class ChatQueryService {
  constructor(private readonly chatRepo: ChatRepository) {}

  getMisConversaciones(idCuenta: number): Promise<ConversacionResponseDto[]> {
    return this.chatRepo.getMisConversaciones(idCuenta);
  }

  getMensajes(idConversacion: number): Promise<MensajeResponseDto[]> {
    return this.chatRepo.getMensajes(idConversacion);
  }

  getNoLeidos(idCuenta: number): Promise<{ id_conversacion: number; no_leidos: number }[]> {
    return this.chatRepo.getNoLeidos(idCuenta);
  }

  getUsuariosDisponibles(idSede: number, idCuentaActual: number): Promise<any[]> {
    return this.chatRepo.getUsuariosDisponibles(idSede, idCuentaActual);
  }
}