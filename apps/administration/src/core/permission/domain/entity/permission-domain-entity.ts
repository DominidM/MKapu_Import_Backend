export type PermissionTier = 'ver' | 'crear' | 'editar' | 'especial';

export interface PermissionProps {
  id_permiso?:  number;
  nombre:       string;
  descripcion?: string;
  activo?:      boolean;
  modulo?:      string;
  depende_de?:  number | null;
}

export class Permission {
  private constructor(private readonly props: PermissionProps) {}

  static create(props: PermissionProps): Permission {
    return new Permission({
      ...props,
      activo:     props.activo     ?? true,
      modulo:     props.modulo     ?? 'General',
      depende_de: props.depende_de ?? null,
    });
  }

  get id_permiso()  { return this.props.id_permiso; }
  get nombre()      { return this.props.nombre; }
  get descripcion() { return this.props.descripcion; }
  get activo()      { return this.props.activo; }
  get modulo()      { return this.props.modulo ?? 'General'; }
  get depende_de()  { return this.props.depende_de ?? null; }

  isActive(): boolean { return this.props.activo === true; }

  get tier(): PermissionTier {
    const n = this.props.nombre.toUpperCase();
    if (n.startsWith('VER_') || n.startsWith('CONTEO_') || n === 'CERRAR_CAJA') return 'ver';
    if (n.startsWith('CREAR_') || n.startsWith('AGREGAR_') || n.startsWith('ASIGNAR_')) return 'crear';
    if (n.startsWith('EDITAR_') || n.startsWith('MODIFICAR_')) return 'editar';
    return 'especial';
  }
}