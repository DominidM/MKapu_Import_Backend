export interface SedeInfo {
  id_sede: number;
  nombre: string;
  codigo: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  telefono: string;
}

export interface ISedeProxy {
  getSedeById(id_sede: number): Promise<SedeInfo | null>;
}