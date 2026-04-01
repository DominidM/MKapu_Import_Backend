export class ConversacionParticipante {
  constructor(
    public id:              number,
    public id_conversacion: number,
    public id_cuenta:       number,
    public unido_en:        Date,
  ) {}
}