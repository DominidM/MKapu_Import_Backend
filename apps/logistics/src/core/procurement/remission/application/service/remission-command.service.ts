/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CarrierOrmEntity } from '../../infrastructure/entity/carrier-orm.entity';
import { SalesReceiptOrmEntity } from 'apps/sales/src/core/sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import {
  RemissionStatus,
  TransportMode,
} from '../../domain/entity/remission-domain-entity';
import { DriverOrmEntity } from '../../infrastructure/entity/driver-orm.entity';
import { RemissionDetailOrmEntity } from '../../infrastructure/entity/remission-detail-orm.entity';
import { RemissionOrmEntity } from '../../infrastructure/entity/remission-orm.entity';
import { GuideTransferOrm } from '../../infrastructure/entity/transport_guide-orm.entity';
import { VehiculoOrmEntity } from '../../infrastructure/entity/vehicle-orm.entity';
import { CreateRemissionDto } from '../dto/in/create-remission.dto';
import { StockOrmEntity } from 'apps/logistics/src/core/warehouse/inventory/infrastructure/entity/stock-orm-entity';

@Injectable()
export class RemissionCommandService {
  constructor(private readonly dataSource: DataSource) {}
  async createRemission(dto: CreateRemissionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(SalesReceiptOrmEntity, {
        where: { id_comprobante: dto.id_comprobante_ref },
        relations: ['details'],
      });

      if (!sale) throw new NotFoundException('Venta no encontrada (2-A)');

      // if (sale.estado_despacho === 'EN_CAMINO') throw new ConflictException('La venta ya fue despachada');

      for (const itemDto of dto.items) {
        const itemVenta = sale.details.find(
          (d) => d.cod_prod === itemDto.cod_prod,
        );
        if (!itemVenta || itemDto.cantidad > itemVenta.cantidad) {
          throw new BadRequestException(
            `Cantidad excedente para producto ${itemDto.cod_prod}`,
          );
        }

        const stock = await queryRunner.manager.findOne(StockOrmEntity, {
          where: {
            id_producto: itemDto.id_producto,
            id_sede: dto.id_sede_origen,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!stock || stock.cantidad < itemDto.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${itemDto.cod_prod} (2-B)`,
          );
        }

        stock.cantidad -= itemDto.cantidad;
        await queryRunner.manager.save(stock);
      }
      const guia = new RemissionOrmEntity();
      guia.serie = 'T001';
      guia.numero = await this.generateCorrelative(queryRunner);
      guia.fecha_emision = new Date();
      guia.fecha_inicio = new Date(dto.fecha_inicio_traslado);
      guia.motivo_traslado = dto.motivo_traslado;
      guia.modalidad = dto.modalidad;
      guia.tipo_guia = dto.tipo_guia;
      guia.peso_total = dto.peso_bruto_total;
      guia.cantidad = dto.items.reduce((acc, i) => acc + i.cantidad, 0);
      guia.estado = RemissionStatus.EMITIDO;

      // Relaciones FK
      guia.id_comprobante_ref = sale.id_comprobante;
      guia.id_usuario_ref = dto.id_usuario;
      guia.id_sede_ref = dto.id_sede_origen;

      const savedGuia = await queryRunner.manager.save(guia);

      const transfer = new GuideTransferOrm();
      transfer.guia = savedGuia;
      transfer.id_guia = savedGuia.id_guia;
      transfer.direccion_origen = dto.datos_traslado.direccion_origen;
      transfer.ubigeo_origen = dto.datos_traslado.ubigeo_origen;
      transfer.direccion_destino = dto.datos_traslado.direccion_destino;
      transfer.ubigeo_destino = dto.datos_traslado.ubigeo_destino;
      await queryRunner.manager.save(transfer);

      if (dto.modalidad === TransportMode.PRIVADO) {
        const driver = new DriverOrmEntity();
        driver.guia = savedGuia;
        driver.id_guia = savedGuia.id_guia;
        driver.nombre_completo = dto.datos_transporte.nombre_completo;
        driver.tipo_documento = dto.datos_transporte.tipo_documento;
        driver.numero_documento = dto.datos_transporte.numero_documento;
        driver.licencia = dto.datos_transporte.licencia;
        await queryRunner.manager.save(driver);

        // Registrar Vehículo
        const vehicle = new VehiculoOrmEntity();
        vehicle.guia = savedGuia;
        vehicle.id_guia = savedGuia.id_guia;
        vehicle.placa = dto.datos_transporte.placa;
        await queryRunner.manager.save(vehicle);
      } else {
        // Registrar Transportista (Carrier)
        const carrier = new CarrierOrmEntity();
        carrier.guia = savedGuia;
        carrier.id_guia = savedGuia.id_guia;
        carrier.ruc = dto.datos_transporte.ruc;
        carrier.razon_social = dto.datos_transporte.razon_social;
        await queryRunner.manager.save(carrier);
      }

      const detalles = dto.items.map((i) => {
        const det = new RemissionDetailOrmEntity();
        det.guia = savedGuia;
        det.id_guia = savedGuia.id_guia;
        det.id_producto = i.id_producto;
        det.cod_prod = i.cod_prod;
        det.cantidad = i.cantidad;
        det.peso_total = i.peso_total;
        // Calcular peso unitario simple
        det.peso_unitario = i.peso_total / i.cantidad;
        return det;
      });
      await queryRunner.manager.save(detalles);

      // sale.estado_despacho = 'EN_CAMINO';
      // await queryRunner.manager.save(sale);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Guía generada correctamente',
        id_guia: savedGuia.id_guia,
        serie_numero: `${savedGuia.serie}-${savedGuia.numero}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error en el proceso de emisión de guía (4-B)',
      );
    } finally {
      await queryRunner.release();
    }
  }
  private async generateCorrelative(queryRunner: any): Promise<number> {
    const last = await queryRunner.manager.find(RemissionOrmEntity, {
      order: { numero: 'DESC' },
      take: 1,
    });
    return last.length > 0 ? last[0].numero + 1 : 1;
  }
}
