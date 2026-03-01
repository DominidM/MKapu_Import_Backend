import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPromotionCommandPort } from '../../domain/ports/in/promotion-ports-in';
import { IPromotionRepositoryPort } from '../../domain/ports/out/promotion-ports-out';
import { PromotionMapper } from '../mapper/promotion.mapper';
import { CreatePromotionDto, UpdatePromotionDto, ChangePromotionStatusDto } from '../dto/in';
import { PromotionDomainEntity } from '../../domain/entity/promotion-domain-entity';
import { PromotionDto } from '../dto/out/promotion.dto';
import { PromotionRuleDomainEntity } from '../../domain/entity/promotion-rule-domain-entity';

@Injectable()
export class PromotionCommandService implements IPromotionCommandPort {
  constructor(
    @Inject('IPromotionRepositoryPort')
    private readonly repository: IPromotionRepositoryPort,
  ) {}

  async deletePromotion(id: number): Promise<{ idPromocion: number; message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    await this.repository.changeStatus(id, false); // Desactiva
    return { idPromocion: id, message: 'Promoción desactivada correctamente' };
  }

  async registerPromotion(dto: CreatePromotionDto): Promise<PromotionDto> {
    const promotion = PromotionDomainEntity.create({
      concepto: dto.concepto,
      tipo: dto.tipo,
      valor: Number(dto.valor),
      activo: dto.activo ?? true,
      reglas: (dto.reglas ?? []).map(rule =>
        PromotionRuleDomainEntity.create({
          idPromocion: undefined,
          tipoCondicion: rule.tipoCondicion,
          valorCondicion: rule.valorCondicion,
        })
      ),
      descuentosAplicados: dto.descuentosAplicados?.map(desc => ({
        idDescuento: desc.idDescuento ?? undefined,
        monto: desc.monto
      })) ?? [],
    });
    const saved = await this.repository.save(promotion);
    return PromotionMapper.toResponseDto(saved);
  }

  async updatePromotion(id: number, dto: UpdatePromotionDto): Promise<PromotionDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    const updated = PromotionDomainEntity.create({
      idPromocion: id,
      concepto: dto.concepto ?? existing.concepto,
      tipo: dto.tipo ?? existing.tipo,
      valor: dto.valor !== undefined ? Number(dto.valor) : existing.valor,
      activo: dto.activo ?? existing.activo,
      reglas: dto.reglas?.map(rule =>
        PromotionRuleDomainEntity.create({
          idRegla: rule.idRegla ?? undefined,
          idPromocion: id,
          tipoCondicion: rule.tipoCondicion,
          valorCondicion: rule.valorCondicion,
        })
      ) ?? existing.reglas ?? [],
      descuentosAplicados: dto.descuentosAplicados?.map(desc => ({
        idDescuento: desc.idDescuento ?? undefined,
        monto: desc.monto
      })) ?? existing.descuentosAplicados ?? [],
    });
    const result = await this.repository.update(id, updated);
    return PromotionMapper.toResponseDto(result);
  }

  async changeStatus(dto: ChangePromotionStatusDto): Promise<PromotionDto> {
    const updated = await this.repository.changeStatus(dto.idPromocion, dto.activo);
    return PromotionMapper.toResponseDto(updated);
  }

  async hardDeletePromotion(id: number): Promise<{ idPromocion: number; message: string }> {
  const existing = await this.repository.findById(id);
  if (!existing) throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
  await this.repository.delete(id);
  return { idPromocion: id, message: 'Promoción eliminada permanentemente' };
}
}