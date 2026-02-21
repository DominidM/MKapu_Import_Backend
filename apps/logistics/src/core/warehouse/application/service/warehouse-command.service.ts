import { Injectable, BadRequestException } from '@nestjs/common';
import { IWarehouseRepository } from '../../domain/ports/out/warehouse-ports-out';
import { Warehouse } from '../../domain/entity/warehouse-domain-entity';

@Injectable()
export class WarehouseCommandService {
  constructor(private readonly repo: IWarehouseRepository) {}

  async create(w: Warehouse): Promise<Warehouse> {
    try {
      w.validate();
      return await this.repo.create(w);
    } catch (err: any) {
      if (err instanceof Error) {
        console.warn('[WarehouseCommandService] validation/create error:', err.message);
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  /**
   * Update robusto:
   * - intenta leer la entidad existente
   * - llama a repo.update (la implementación concreta debe persistir)
   * - registra varios logs para troubleshooting
   */
  async update(id: number, partial: Partial<Warehouse>): Promise<Warehouse> {
    try {
      console.log('[WarehouseCommandService] update called id=', id, 'partial=', partial);

      // Intento de obtener entidad existente (si el repo provee findById)
      let existing: Warehouse | null = null;
      if (typeof (this.repo as any).findById === 'function') {
        try {
          existing = await (this.repo as any).findById(id);
          console.log('[WarehouseCommandService] existing fetched:', !!existing);
        } catch (e) {
          console.warn('[WarehouseCommandService] findById failed:', e);
        }
      }

      // Llamar al repo.update (implementación concreta debe persistir y devolver entidad actualizada)
      if (typeof (this.repo as any).update === 'function') {
        const updated = await (this.repo as any).update(id, partial);
        console.log('[WarehouseCommandService] repo.update returned:', !!updated);
        return updated;
      }

      // Si repo.update no existe, intentar fallback: merge + save si repo tiene save
      if (existing && typeof (this.repo as any).save === 'function') {
        for (const key of Object.keys(partial)) {
          // @ts-ignore
          (existing as any)[key] = (partial as any)[key];
        }
        const saved = await (this.repo as any).save(existing);
        console.log('[WarehouseCommandService] fallback save completed id=', (saved as any).id_almacen ?? (saved as any).id);
        return saved;
      }

      throw new Error('Repositorio no soporta operación update ni save.');
    } catch (err: any) {
      console.warn('[WarehouseCommandService] update error:', err);
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  /**
   * Actualiza el estado (activo/inactivo) del almacén.
   */
  async updateStatus(id: number, activo: boolean): Promise<Warehouse> {
    try {
      console.log('[WarehouseCommandService] updateStatus called id=', id, 'activo=', activo);

      // Preferir repo.update si existe
      if (typeof (this.repo as any).update === 'function') {
        const updated = await (this.repo as any).update(id, { activo } as Partial<Warehouse>);
        console.log('[WarehouseCommandService] repo.update (status) returned:', !!updated);
        return updated;
      }

      // Fallback: find + save
      if (typeof (this.repo as any).findById === 'function' && typeof (this.repo as any).save === 'function') {
        const existing = await (this.repo as any).findById(id);
        if (!existing) throw new Error(`Almacén con id ${id} no encontrado.`);
        // @ts-ignore
        existing.activo = activo;
        const saved = await (this.repo as any).save(existing);
        console.log('[WarehouseCommandService] fallback save (status) completed id=', (saved as any).id_almacen ?? (saved as any).id);
        return saved;
      }

      throw new Error('Repositorio no soporta updateStatus (ni update ni findById/save).');
    } catch (err: any) {
      console.warn('[WarehouseCommandService] updateStatus error:', err);
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  /**
   * Soft-delete: desactivar el almacén
   */
  async remove(id: number): Promise<void> {
    try {
      await this.updateStatus(id, false);
    } catch (err: any) {
      if (err instanceof Error) {
        console.warn('[WarehouseCommandService] remove (soft) error:', err.message);
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}