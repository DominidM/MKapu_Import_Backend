/* ============================================
   administration/src/core/role/domain/entity/role-domain-entity.ts
   ============================================ */

export interface RoleProps {
  id_rol?: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export class Role {
  private constructor(private readonly props: RoleProps) {}

  static create(props: RoleProps): Role {
    return new Role({
      ...props,
      activo: props.activo ?? true,
    });
  }

  get id_rol() {
    return this.props.id_rol;
  }

  get nombre() {
    return this.props.nombre;
  }

  get descripcion() {
    return this.props.descripcion;
  }

  get activo() {
    return this.props.activo;
  }

  isActive(): boolean {
    return this.props.activo === true;
  }
}