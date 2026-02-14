import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IWastageCommandPort } from '../../domain/ports/in/wastage.port.in';
import { IWastageRepositoryPort } from '../../domain/ports/out/wastage.port.out';
import { CreateWastageDto } from '../dto/in/create-wastage.dto';
import { WastageResponseDto } from '../dto/out/wastage-response.dto';
import { WastageMapper } from '../mapper/wastage.mapper';
import { Wastage, WastageDetail } from '../../domain/entity/wastage-domain-intity';
import { InventoryCommandService } from '../../../../warehouse/inventory/application/service/inventory-command.service';

@Injectable()
export class WastageCommandService implements IWastageCommandPort {
  constructor(
    @Inject('IWastageRepositoryPort')
    private readonly repository: IWastageRepositoryPort,
    private readonly inventoryService: InventoryCommandService,
  ) {}

  async create(dto: CreateWastageDto): Promise<WastageResponseDto> {
    for (const item of dto.detalles) {
      const stockDisponible = await this.inventoryService.getStockLevel(
        item.id_producto,
        dto.id_almacen_ref,
      );
      if (!stockDisponible || stockDisponible < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ID ${item.id_producto}. ` +
          `Disponible: ${stockDisponible || 0}, Requerido: ${item.cantidad}`,
        );
      }
    }

    const detalles = dto.detalles.map(
      (d) =>
        new WastageDetail(
          null,
          d.id_producto,
          d.cod_prod,
          d.desc_prod,
          d.cantidad,
          d.pre_unit, // Ya es number, no necesitas Number()
          d.id_tipo_merma,
          d.observacion,
        ),
    );

    const domain = new Wastage(
      null,
      dto.id_usuario_ref,
      dto.id_sede_ref,
      dto.id_almacen_ref,
      dto.motivo,
      new Date(),
      true,
      detalles,
    );

    const savedWastage = await this.repository.save(domain);

    await this.inventoryService.registerExit({
      originType: 'AJUSTE',
      refId: savedWastage.id_merma!,
      refTable: 'merma',
      observation: `Merma registrada: ${dto.motivo}`,
      items: dto.detalles.map((d) => ({
        productId: d.id_producto,
        warehouseId: dto.id_almacen_ref,
        quantity: d.cantidad,
      })),
    });

    return WastageMapper.toResponseDto(savedWastage);
  }
}