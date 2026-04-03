import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IChatRepositoryPort } from '../../../../domain/ports/out/chat-repository-port';
import { ConversacionOrmEntity } from '../../../entity/conversacion.orm-entity';
import { CrearConversacionPrivadaDto } from '../../../../application/dto/in/crear-conversacion-privada.dto';
import { EnviarMensajeDto } from '../../../../application/dto/in/enviar-mensaje.dto';
import { MarcarLeidosDto } from '../../../../application/dto/in/marcar-leidos.dto';
import { ConversacionResponseDto } from '../../../../application/dto/out/conversacion-response.dto';
import { MensajeResponseDto } from '../../../../application/dto/out/mensaje-response.dto';
import { UsuarioDisponibleResponseDto } from '../../../../application/dto/out/usuario-disponible-response.dto';
import { ChatMapper } from '../../../../application/mapper/chat.mapper';
import { ConversacionParticipanteOrmEntity } from '../../../entity/conversacion-participante.orm-entity';
import { MensajeOrmEntity } from '../../../entity/mensaje.orm-entity';

@Injectable()
export class ChatRepository implements IChatRepositoryPort {
  constructor(
    @InjectRepository(ConversacionOrmEntity)
    private readonly convRepo: Repository<ConversacionOrmEntity>,

    @InjectRepository(ConversacionParticipanteOrmEntity)
    private readonly partRepo: Repository<ConversacionParticipanteOrmEntity>,

    @InjectRepository(MensajeOrmEntity)
    private readonly mensajeRepo: Repository<MensajeOrmEntity>,

    private readonly dataSource: DataSource,
  ) {}

  // ── GET mis conversaciones ────────────────────────────
  async getMisConversaciones(idCuenta: number): Promise<ConversacionResponseDto[]> {
    const rows = await this.dataSource.query(`
      SELECT
        c.id_conversacion,
        c.tipo,
        CASE
          WHEN c.tipo = 'GRUPAL'  THEN c.nombre
          WHEN c.tipo = 'PRIVADO' THEN otros.nom_usu
        END AS nombre_chat,
        c.id_sede,
        ult.contenido  AS ultimo_mensaje,
        ult.enviado_en AS fecha_ultimo,
        COALESCE(nl.no_leidos, 0) AS no_leidos
      FROM conversacion_participante cp
      JOIN conversacion c ON c.id_conversacion = cp.id_conversacion
      LEFT JOIN conversacion_participante cp2
        ON cp2.id_conversacion = c.id_conversacion
        AND cp2.id_cuenta != ?
        AND c.tipo = 'PRIVADO'
      LEFT JOIN cuenta_usuario otros ON otros.id_cuenta = cp2.id_cuenta
      LEFT JOIN (
        SELECT id_conversacion, contenido, enviado_en
        FROM mensaje
        WHERE id_mensaje IN (
          SELECT MAX(id_mensaje) FROM mensaje GROUP BY id_conversacion
        )
      ) ult ON ult.id_conversacion = c.id_conversacion
      LEFT JOIN (
        SELECT m.id_conversacion, COUNT(*) AS no_leidos
        FROM mensaje m
        JOIN conversacion_participante cp3
          ON cp3.id_conversacion = m.id_conversacion
        WHERE cp3.id_cuenta  = ?
          AND m.id_cuenta   != ?
          AND m.leido        = b'0'
        GROUP BY m.id_conversacion
      ) nl ON nl.id_conversacion = c.id_conversacion
      WHERE cp.id_cuenta = ?
      ORDER BY ult.enviado_en DESC
    `, [idCuenta, idCuenta, idCuenta, idCuenta]);
    return rows.map(ChatMapper.rawToConversacionDto);
  }

  // ── GET mensajes ──────────────────────────────────────
  async getMensajes(idConversacion: number): Promise<MensajeResponseDto[]> {
    const rows = await this.dataSource.query(`
      SELECT m.id_mensaje, m.id_conversacion, m.id_cuenta,
             m.contenido, m.enviado_en, m.leido,
             cu.nom_usu AS remitente
      FROM mensaje m
      JOIN cuenta_usuario cu ON cu.id_cuenta = m.id_cuenta
      WHERE m.id_conversacion = ?
      ORDER BY m.enviado_en ASC
    `, [idConversacion]);
    return rows.map(ChatMapper.rawToMensajeDto);
  }

  // ── GET no leídos ─────────────────────────────────────
  async getNoLeidos(idCuenta: number): Promise<{ id_conversacion: number; no_leidos: number }[]> {
    const rows = await this.dataSource.query(`
      SELECT m.id_conversacion, COUNT(*) AS no_leidos
      FROM mensaje m
      JOIN conversacion_participante cp
        ON cp.id_conversacion = m.id_conversacion
      WHERE cp.id_cuenta  = ?
        AND m.id_cuenta  != ?
        AND m.leido       = b'0'
      GROUP BY m.id_conversacion
    `, [idCuenta, idCuenta]);
    return rows.map((r: any) => ({
      id_conversacion: Number(r.id_conversacion),
      no_leidos:       Number(r.no_leidos),
    }));
  }

  // ── GET usuarios disponibles ──────────────────────────
  async getUsuariosDisponibles(
    idSede: number,
    idCuentaActual: number,
  ): Promise<UsuarioDisponibleResponseDto[]> {
    const rows = await this.dataSource.query(`
      SELECT id_cuenta, nom_usu, email_emp, id_sede
      FROM cuenta_usuario
      WHERE activo    = 1
        AND id_sede   = ?
        AND id_cuenta != ?
      ORDER BY nom_usu ASC
    `, [idSede, idCuentaActual]);
    return rows.map(ChatMapper.rawToUsuarioDisponibleDto);
  }

  // ── POST crear conversación privada ───────────────────
  async crearConversacionPrivada(
    dto: CrearConversacionPrivadaDto,
  ): Promise<ConversacionResponseDto> {
    const existe = await this.dataSource.query(`
      SELECT cp1.id_conversacion
      FROM conversacion_participante cp1
      JOIN conversacion_participante cp2
        ON cp1.id_conversacion = cp2.id_conversacion
      JOIN conversacion c
        ON c.id_conversacion = cp1.id_conversacion
      WHERE cp1.id_cuenta = ?
        AND cp2.id_cuenta = ?
        AND c.tipo = 'PRIVADO'
      LIMIT 1
    `, [dto.id_cuenta_1, dto.id_cuenta_2]);

    if (existe.length > 0) {
      const rows = await this.dataSource.query(`
        SELECT
          c.id_conversacion,
          c.tipo,
          cu.nom_usu AS nombre_chat,
          c.id_sede,
          NULL AS ultimo_mensaje,
          NULL AS fecha_ultimo,
          0    AS no_leidos
        FROM conversacion c
        JOIN conversacion_participante cp
          ON cp.id_conversacion = c.id_conversacion
          AND cp.id_cuenta != ?
        JOIN cuenta_usuario cu ON cu.id_cuenta = cp.id_cuenta
        WHERE c.id_conversacion = ?
      `, [dto.id_cuenta_1, existe[0].id_conversacion]);
      return ChatMapper.rawToConversacionDto(rows[0]);
    }

    const conv = await this.convRepo.save({
      nombre:  null,
      tipo:    'PRIVADO',
      id_sede: dto.id_sede,
    });

    await this.partRepo.save([
      { id_conversacion: conv.id_conversacion, id_cuenta: dto.id_cuenta_1 },
      { id_conversacion: conv.id_conversacion, id_cuenta: dto.id_cuenta_2 },
    ]);

    return ChatMapper.ormToConversacionDto(conv);
  }

  // ── POST enviar mensaje ───────────────────────────────
  async enviarMensaje(dto: EnviarMensajeDto): Promise<MensajeResponseDto> {
    const mensaje = await this.mensajeRepo.save({
      id_conversacion: dto.id_conversacion,
      id_cuenta:       dto.id_cuenta,
      contenido:       dto.contenido,
    });

    const cuenta = await this.dataSource.query(`
      SELECT nom_usu FROM cuenta_usuario WHERE id_cuenta = ?
    `, [dto.id_cuenta]);

    return ChatMapper.ormToMensajeDto(mensaje, cuenta[0]?.nom_usu ?? '');
  }

  // ── PATCH marcar leídos ───────────────────────────────
  async marcarLeidos(dto: MarcarLeidosDto): Promise<void> {
    await this.dataSource.query(`
      UPDATE mensaje
      SET leido = b'1'
      WHERE id_conversacion = ?
        AND id_cuenta != ?
        AND leido = b'0'
    `, [dto.id_conversacion, dto.id_cuenta]);
  }
}