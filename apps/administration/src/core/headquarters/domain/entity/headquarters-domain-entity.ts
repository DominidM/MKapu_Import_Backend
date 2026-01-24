/*  administration/src/core/headquarters/domain/entity/headquarters-domain-entity.ts */

export interface HeadquartersProps {
  id_sede?: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  telefono: string;
  activo: boolean;
}

export class Headquarters {
  private constructor(private readonly props: HeadquartersProps) {}

  static create(props: HeadquartersProps): Headquarters {
    return new Headquarters({
      ...props,
      activo: props.activo ?? true,
    });
  }

  get id_sede() {
    return this.props.id_sede;
  }
  get codigo() {
    return this.props.codigo;
  }

  get nombre() {
    return this.props.nombre;
  }

  get ciudad() {
    return this.props.ciudad;
  }

  get departamento() {
    return this.props.departamento;
  }
  
  get direccion() {
    return this.props.direccion;
  }

  get telefono() {
    return this.props.telefono;
  }

  isActive(): boolean {
    return this.props.activo === true;
  }
}
