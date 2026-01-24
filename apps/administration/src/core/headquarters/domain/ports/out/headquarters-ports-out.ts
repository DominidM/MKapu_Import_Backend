/*  administration/src/core/headquarters/domain/ports/out/headquarters-ports-out.ts */

import { Headquarters } from "../../entity/headquarters-domain-entity";

export interface IHeadquartersRepositoryPort {
    save(headquarters: Headquarters): Promise<Headquarters>;

    update(headquarters: Headquarters): Promise<Headquarters>;

    delete(id_sede: number): Promise<void>;

    findById(id_sede: number): Promise<Headquarters | null>;

    findByCode(code: string): Promise<Headquarters | null>;

    findByName(name: string): Promise<Headquarters | null>;

    findAll(filters?: { activo?: boolean; search?: string }): Promise<Headquarters[]>;

    existsByCode(code: string): Promise<boolean>;

    existsByName(name: string): Promise<boolean>;
}