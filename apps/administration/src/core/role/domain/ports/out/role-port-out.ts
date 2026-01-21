/* ============================================
   administration/src/core/role/domain/ports/out/role-port-out.ts
   ============================================ */

import { Role } from '../../entity/role-domain-entity';

export interface IRoleRepositoryPort {
  // Comandos de escritura
  save(role: Role): Promise<Role>;
  update(role: Role): Promise<Role>;
  delete(id: number): Promise<void>;

  // Consultas de lectura
  findById(id: number): Promise<Role | null>;
  findByName(nombre: string): Promise<Role | null>;
  findAll(filters?: {
    activo?: boolean;
    search?: string;
  }): Promise<Role[]>;

  // Validaciones
  existsByName(nombre: string): Promise<boolean>;
}
