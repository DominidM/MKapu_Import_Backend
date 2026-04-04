export class Conversacion {
  constructor(
    public id_conversacion: number,
    public nombre:          string | null,
    public tipo:            'PRIVADO' | 'GRUPAL',
    public id_sede:         number | null,
    public creado_en:       Date,
  ) {}
}