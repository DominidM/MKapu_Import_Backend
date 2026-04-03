export class ConversacionResponseDto {
  id_conversacion: number;
  nombre_chat:     string | null;
  tipo:            'PRIVADO' | 'GRUPAL';
  id_sede:         number | null;
  ultimo_mensaje:  string | null;
  fecha_ultimo:    Date | null;
  no_leidos:       number;
}