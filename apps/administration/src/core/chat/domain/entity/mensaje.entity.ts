export class Mensaje {
  constructor(
    public id_mensaje:      number,
    public id_conversacion: number,
    public id_cuenta:       number,
    public contenido:       string,
    public enviado_en:      Date,
    public leido:           boolean,
  ) {}
}