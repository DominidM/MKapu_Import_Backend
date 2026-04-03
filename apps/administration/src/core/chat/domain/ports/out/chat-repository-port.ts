// ─────────────────────────────────────────────────────────
// IChatRepositoryPort — agrega crearGrupo a la interfaz
// Ruta: domain/ports/out/chat-repository-port.ts
// ─────────────────────────────────────────────────────────
//
// Agrega este método a tu interfaz existente:

import { CrearGrupoDto } from '../../../application/dto/in/crear-grupo.dto';
import { ConversacionResponseDto } from '../../../application/dto/out/conversacion-response.dto';

// Añade a IChatRepositoryPort:
//
//   crearGrupo(dto: CrearGrupoDto): Promise<ConversacionResponseDto>;
//
// Ejemplo de la interfaz completa:

export interface IChatRepositoryPort {
  getMisConversaciones(idCuenta: number): Promise<any[]>;
  getMensajes(idConversacion: number): Promise<any[]>;
  getNoLeidos(idCuenta: number): Promise<any[]>;
  getUsuariosDisponibles(idSede: number, idCuentaActual: number): Promise<any[]>;
  crearConversacionPrivada(dto: any): Promise<ConversacionResponseDto>;
  crearGrupo(dto: CrearGrupoDto): Promise<ConversacionResponseDto>;   // ← NUEVO
  enviarMensaje(dto: any): Promise<any>;
  marcarLeidos(dto: any): Promise<void>;
}