/* eslint-disable prettier/prettier */
import { Unit, UnitStatus } from "../../../domain/entity/unit-domain-intity";
import { CreateUnitDto } from "../../dto/in/create-unit-dto";
import { UpdateUnitDto } from "../../dto/in/update-unit-dto";

export interface UnitPortsIn {
  // Crear una nueva unidad (ingreso físico)
  createUnit(dto: CreateUnitDto): Promise<Unit>;

  // Obtener por ID
  getUnitById(id: number): Promise<Unit>;

  // Obtener por Número de Serie (Búsqueda rápida)
  getUnitBySerial(serialNumber: string): Promise<Unit>;

  // Listar unidades (con filtros opcionales)
  listUnits(filters: { productId?: number; warehouseId?: number; status?: UnitStatus }): Promise<Unit[]>;

  // Actualizar datos
  updateUnit(id: number, dto: UpdateUnitDto): Promise<Unit>;

  // Dar de baja (Soft Delete o cambio de estado a BAJA)
  discardUnit(id: number, reason: string): Promise<Unit>;
}