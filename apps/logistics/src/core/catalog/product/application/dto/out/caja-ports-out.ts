// domain/ports/out/caja-ports-out.ts

import { Caja } from "../../../domain/entity/caja-domain-entity";


export interface ICajaRepository {
  findById(id_caja: number):           Promise<Caja | null>;
  findByProducto(id_producto: number): Promise<Caja[]>;
  findByCodigo(cod_caja: string):      Promise<Caja | null>;
  existsByCodigo(cod_caja: string):    Promise<boolean>;
  save(caja: Caja):                    Promise<Caja>;
  update(caja: Caja):                  Promise<Caja>;
  delete(id_caja: number):             Promise<void>;
}