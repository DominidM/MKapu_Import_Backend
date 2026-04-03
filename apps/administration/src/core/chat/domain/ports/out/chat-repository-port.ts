import { CrearConversacionPrivadaDto } from "../../../application/dto/in/crear-conversacion-privada.dto";
import { EnviarMensajeDto } from "../../../application/dto/in/enviar-mensaje.dto";
import { MarcarLeidosDto } from "../../../application/dto/in/marcar-leidos.dto";
import { ConversacionResponseDto } from "../../../application/dto/out/conversacion-response.dto";
import { MensajeResponseDto } from "../../../application/dto/out/mensaje-response.dto";


export const CHAT_REPOSITORY_PORT = 'CHAT_REPOSITORY_PORT';

export interface IChatRepositoryPort {
  getMisConversaciones(idCuenta: number): Promise<ConversacionResponseDto[]>;
  getMensajes(idConversacion: number): Promise<MensajeResponseDto[]>;
  getNoLeidos(idCuenta: number): Promise<{ id_conversacion: number; no_leidos: number }[]>;
  getUsuariosDisponibles(idSede: number, idCuentaActual: number): Promise<any[]>;
  crearConversacionPrivada(dto: CrearConversacionPrivadaDto): Promise<ConversacionResponseDto>;
  enviarMensaje(dto: EnviarMensajeDto): Promise<MensajeResponseDto>;
  marcarLeidos(dto: MarcarLeidosDto): Promise<void>;
}
