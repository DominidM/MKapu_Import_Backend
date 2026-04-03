
import { ConversacionOrmEntity } from '../../infrastructure/entity/conversacion.orm-entity';
import { MensajeOrmEntity } from '../../infrastructure/entity/mensaje.orm-entity';
import { ConversacionResponseDto }          from '../dto/out/conversacion-response.dto';
import { MensajeResponseDto }               from '../dto/out/mensaje-response.dto';
import { UsuarioDisponibleResponseDto }     from '../dto/out/usuario-disponible-response.dto';

export class ChatMapper {

  // ── Raw query → ConversacionResponseDto ──────────────
  static rawToConversacionDto(raw: any): ConversacionResponseDto {
    const dto        = new ConversacionResponseDto();
    dto.id_conversacion = Number(raw.id_conversacion);
    dto.nombre_chat     = raw.nombre_chat     ?? null;
    dto.tipo            = raw.tipo            ?? 'GRUPAL';
    dto.id_sede         = raw.id_sede ? Number(raw.id_sede) : null;
    dto.ultimo_mensaje  = raw.ultimo_mensaje  ?? null;
    dto.fecha_ultimo    = raw.fecha_ultimo    ? new Date(raw.fecha_ultimo) : null;
    dto.no_leidos       = Number(raw.no_leidos) || 0;
    return dto;
  }

  // ── Raw query → MensajeResponseDto ───────────────────
  static rawToMensajeDto(raw: any): MensajeResponseDto {
    const dto        = new MensajeResponseDto();
    dto.id_mensaje      = Number(raw.id_mensaje);
    dto.id_conversacion = Number(raw.id_conversacion);
    dto.id_cuenta       = Number(raw.id_cuenta);
    dto.remitente       = raw.remitente  ?? '';
    dto.contenido       = raw.contenido  ?? '';
    dto.enviado_en      = new Date(raw.enviado_en);
    dto.leido           = Boolean(raw.leido);
    return dto;
  }

  // ── ORM → MensajeResponseDto (para insert) ───────────
  static ormToMensajeDto(orm: MensajeOrmEntity, nomUsu: string): MensajeResponseDto {
    const dto        = new MensajeResponseDto();
    dto.id_mensaje      = orm.id_mensaje;
    dto.id_conversacion = orm.id_conversacion;
    dto.id_cuenta       = orm.id_cuenta;
    dto.remitente       = nomUsu;
    dto.contenido       = orm.contenido;
    dto.enviado_en      = orm.enviado_en;
    dto.leido           = Boolean(orm.leido);
    return dto;
  }

  // ── ORM → ConversacionResponseDto (para insert) ──────
  static ormToConversacionDto(orm: ConversacionOrmEntity): ConversacionResponseDto {
    const dto        = new ConversacionResponseDto();
    dto.id_conversacion = orm.id_conversacion;
    dto.nombre_chat     = orm.nombre;
    dto.tipo            = orm.tipo;
    dto.id_sede         = orm.id_sede;
    dto.ultimo_mensaje  = null;
    dto.fecha_ultimo    = null;
    dto.no_leidos       = 0;
    return dto;
  }

  // ── Raw query → UsuarioDisponibleResponseDto ─────────
  static rawToUsuarioDisponibleDto(raw: any): UsuarioDisponibleResponseDto {
    const dto      = new UsuarioDisponibleResponseDto();
    dto.id_cuenta  = Number(raw.id_cuenta);
    dto.nom_usu    = raw.nom_usu   ?? '';
    dto.email_emp  = raw.email_emp ?? '';
    dto.id_sede    = Number(raw.id_sede);
    return dto;
  }
}