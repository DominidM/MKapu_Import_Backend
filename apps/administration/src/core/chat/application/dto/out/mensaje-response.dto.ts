export class MensajeResponseDto {
  id_mensaje:      number;
  id_conversacion: number;
  id_cuenta:       number;
  remitente:       string;
  contenido:       string;
  enviado_en:      Date;
  leido:           boolean;
}