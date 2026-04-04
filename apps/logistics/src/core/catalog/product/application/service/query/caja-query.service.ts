// application/service/caja-query.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { CajaResponseDto } from '../../dto/out/caja-response.dto';
import { CajaMapper } from '../../mapper/caja.mapper';
import { CajaTypeOrmRepository } from '../../../infrastructure/adapters/out/repository/caja.typeorm.repository';

@Injectable()
export class CajaQueryService {
constructor(private readonly repo: CajaTypeOrmRepository) {}

  async getById(id_caja: number): Promise<CajaResponseDto> {
    const caja = await this.repo.findById(id_caja);
    if (!caja) throw new NotFoundException(`Caja ${id_caja} no encontrada.`);
    return CajaMapper.toResponseDto(caja);
  }

  async getByProducto(id_producto: number): Promise<CajaResponseDto[]> {
    const cajas = await this.repo.findByProducto(id_producto);
    return cajas.map(CajaMapper.toResponseDto);
  }

  async getByCodigo(cod_caja: string): Promise<CajaResponseDto> {
    const caja = await this.repo.findByCodigo(cod_caja);
    if (!caja) throw new NotFoundException(`Caja con código "${cod_caja}" no encontrada.`);
    return CajaMapper.toResponseDto(caja);
  }
}