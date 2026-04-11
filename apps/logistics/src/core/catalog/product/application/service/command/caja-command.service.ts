// application/service/caja-command.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Caja } from '../../../domain/entity/caja-domain-entity';
import { CreateCajaDto } from '../../dto/in/create-caja.dto';
import { UpdateCajaPreciosDto } from '../../dto/in/update-caja-precios.dto';
import { CajaResponseDto } from '../../dto/out/caja-response.dto';
import { CajaMapper } from '../../mapper/caja.mapper';
import { CajaTypeOrmRepository } from '../../../infrastructure/adapters/out/repository/caja.typeorm.repository';

@Injectable()
export class CajaCommandService {
constructor(private readonly repo: CajaTypeOrmRepository) {}

  async create(dto: CreateCajaDto): Promise<CajaResponseDto> {
    try {
      const existe = await this.repo.existsByCodigo(dto.cod_caja);
      if (existe)
        throw new Error(`Ya existe una caja con el código "${dto.cod_caja}".`);

      const caja  = Caja.create({ ...dto, pre_mayorista: dto.pre_mayorista ?? null });
      const saved = await this.repo.save(caja);
      return CajaMapper.toResponseDto(saved);
    } catch (err: any) {
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  async updatePrecios(id_caja: number, dto: UpdateCajaPreciosDto): Promise<CajaResponseDto> {
    try {
      const caja = await this.repo.findById(id_caja);
      if (!caja) throw new NotFoundException(`Caja ${id_caja} no encontrada.`);

      const actualizada = caja.updatePrecios(dto.pre_caja, dto.pre_mayorista);
      const saved       = await this.repo.update(actualizada);
      return CajaMapper.toResponseDto(saved);
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  async delete(id_caja: number): Promise<void> {
    try {
      const caja = await this.repo.findById(id_caja);
      if (!caja) throw new NotFoundException(`Caja ${id_caja} no encontrada.`);
      await this.repo.delete(id_caja);
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }
}