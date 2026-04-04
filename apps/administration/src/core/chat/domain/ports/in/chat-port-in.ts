import { CrearConversacionPrivadaDto } from "../../../application/dto/in/crear-conversacion-privada.dto";
import { EnviarMensajeDto } from "../../../application/dto/in/enviar-mensaje.dto";
import { MarcarLeidosDto } from "../../../application/dto/in/marcar-leidos.dto";
import { ConversacionResponseDto } from "../../../application/dto/out/conversacion-response.dto";
import { MensajeResponseDto } from "../../../application/dto/out/mensaje-response.dto";


export const CHAT_QUERY_PORT   = 'CHAT_QUERY_PORT';
export const CHAT_COMMAND_PORT = 'CHAT_COMMAND_PORT';

export interface IChatQueryPort {
  getMisConversaciones(idCuenta: number): Promise<ConversacionResponseDto[]>;
  getMensajes(idConversacion: number): Promise<MensajeResponseDto[]>;
  getNoLeidos(idCuenta: number): Promise<{ id_conversacion: number; no_leidos: number }[]>;
  getUsuariosDisponibles(idSede: number, idCuentaActual: number): Promise<any[]>;
}

export interface IChatCommandPort {
  crearConversacionPrivada(dto: CrearConversacionPrivadaDto): Promise<ConversacionResponseDto>;
  enviarMensaje(dto: EnviarMensajeDto): Promise<MensajeResponseDto>;
  marcarLeidos(dto: MarcarLeidosDto): Promise<void>;
}