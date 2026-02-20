// category-domain-entity.ts - quita el import y el método toDomainEntity
import { CategoryOrmEntity } from "../../infrastructure/entity/category-orm.entity"; // ❌ QUITAR

// Solo deja esto:
export interface CategoryProps {
  id_categoria?: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export class Category {
  private constructor(private readonly props: CategoryProps) {}

  static create(props: CategoryProps): Category {
    return new Category({ ...props, activo: props.activo ?? true });
  }

  get id_categoria() { return this.props.id_categoria; }
  get nombre() { return this.props.nombre; }
  get descripcion() { return this.props.descripcion; }
  get activo() { return this.props.activo; }

  isActive(): boolean { return this.props.activo === true; }
  hasDescription(): boolean { return !!this.props.descripcion?.trim(); }
}