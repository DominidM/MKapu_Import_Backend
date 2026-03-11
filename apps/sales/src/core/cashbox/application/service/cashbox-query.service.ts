import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ICashboxQueryPort } from '../../domain/ports/in/cashbox-ports-in';
import { ICashboxRepositoryPort } from '../../domain/ports/out/cashbox-ports-out';
import { CashboxResponseDto } from '../dto/out';
import { CashboxMapper } from '../mapper/cashbox.mapper';
import { buildCashboxThermalPdf, CashboxResumen } from '../../utils/cashbox-thermal.util';

@Injectable()
export class CashboxQueryService implements ICashboxQueryPort {
  constructor(
    @Inject('ICashboxRepositoryPort')
    private readonly repository: ICashboxRepositoryPort,
  ) {}

  async getById(id_caja: string): Promise<CashboxResponseDto | null> {
    const cashbox = await this.repository.findById(id_caja);
    return cashbox ? CashboxMapper.toResponseDto(cashbox) : null;
  }

  async findActiveBySede(id_sede_ref: number): Promise<CashboxResponseDto | null> {
    const cashbox = await this.repository.findActiveBySede(id_sede_ref);
    return cashbox ? CashboxMapper.toResponseDto(cashbox) : null;
  }

  async getResumenDia(idSede: number): Promise<any> {
    return await this.repository.getResumenDia(idSede);
  }

  async exportThermalResumen(idSede: number): Promise<Buffer> {
    const resumen = await this.repository.getResumenDia(idSede);
    if (!resumen) throw new NotFoundException(`No hay caja activa para la sede ${idSede}`);
    return buildCashboxThermalPdf(resumen as CashboxResumen);
  }

  async getHistorialBySede(idSede: number): Promise<any[]> {
    return await this.repository.getHistorialBySede(idSede);
  }

  async exportThermalById(idCaja: string): Promise<Buffer> {
    const resumen = await this.repository.getResumenDiaByCajaId(idCaja);
    if (!resumen) throw new NotFoundException(`No se encontró la caja ${idCaja}`);
    return buildCashboxThermalPdf(resumen as CashboxResumen);
  }
}
