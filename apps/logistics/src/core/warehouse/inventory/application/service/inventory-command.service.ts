import { Inject, Injectable } from '@nestjs/common';
import {
  IInventoryMovementCommandPort,
  MovementRequest,
} from '../../domain/ports/in/inventory-movement-ports-in.';
import { CreateInventoryMovementDto } from '../dto/in/create-inventory-movement.dto';
import { IInventoryRepositoryPort } from '../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMapper } from '../mapper/inventory.mapper';
import { DataSource } from 'typeorm';
import { ConteoInventarioDetalleOrmEntity } from '../../infrastructure/entity/inventory-count-detail-orm.entity';
import {
  ConteoEstado,
  ConteoInventarioOrmEntity,
} from '../../infrastructure/entity/inventory-count-orm.entity';
import { StockOrmEntity } from '../../infrastructure/entity/stock-orm-entity';
import { InventoryMovementOrmEntity } from '../../infrastructure/entity/inventory-movement-orm.entity';
import {
  ActualizarDetalleConteoDto,
  FinalizarConteoDto,
  IniciarConteoDto,
} from '../dto/in/inventory-count-dto-in';

@Injectable()
export class InventoryCommandService implements IInventoryMovementCommandPort {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
    private readonly dataSource: DataSource,
  ) {}
  async getStockLevel(productId: number, warehouseId: number): Promise<number> {
    const stock = await this.repository.findStock(productId, warehouseId);

    if (!stock) return 0;

    const statusStr = String(stock.status || stock.status || '').toUpperCase();
    const isActive =
      statusStr === '1' || statusStr === 'AVAILABLE' || statusStr === 'ACTIVO';

    return isActive ? stock.quantity : 0;
  }
  async executeMovement(dto: CreateInventoryMovementDto): Promise<void> {
    const movement = InventoryMapper.toDomain(dto);
    await this.repository.saveMovement(movement);
  }
  async registerIncome(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({ 
        ...item,
        type: 'INGRESO',
      })),
    };
    await this.executeMovement(fullDto);
  }

  async registerExit(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({
        ...item,
        type: 'SALIDA',
      })),
    };
    await this.executeMovement(fullDto);
  }
  async iniciarConteoInventario(dto: IniciarConteoDto) {
    return await this.dataSource.transaction(async (manager) => {
      const stocksSede = await manager.find(StockOrmEntity, {
        where: { id_sede: dto.idSede },
        relations: ['producto'],
      });

      const nuevoConteo = manager.create(ConteoInventarioOrmEntity, {
        codSede: dto.idSede,
        nomSede: dto.nomSede,
        usuarioCreacionRef: dto.idUsuario,
        estado: ConteoEstado.PENDIENTE,
        totalItems: stocksSede.length,
        totalDiferencias: 0,
      });
      const conteoGuardado = await manager.save(nuevoConteo);

      const detalles = stocksSede.map((s) => {
        const detalleData = {
          conteo: conteoGuardado,
          idProducto: s.id_producto,
          codProd: s.producto.codigo,
          descripcion: s.producto.descripcion,
          uniMed: s.producto.uni_med,
          idStock: s.id_stock,
          idAlmacen: s.id_almacen,
          idSedeRef: Number(s.id_sede),
          stockSistema: s.cantidad,
          stockConteo: 0,
          diferencia: 0 - s.cantidad,
        };
        return manager.create(ConteoInventarioDetalleOrmEntity, detalleData);
      });
      await manager.save(detalles);
      return conteoGuardado;
    });
  }
  async finalizarConteoInventario(idConteo: number, dto: FinalizarConteoDto) {
    return await this.dataSource.transaction(async (manager) => {
      const conteo = await manager.findOne(ConteoInventarioOrmEntity, {
        where: { idConteo },
        relations: ['detalles'],
      });

      if (!conteo) throw new Error('El conteo no existe');
      if (conteo.estado === ConteoEstado.AJUSTADO)
        throw new Error('Este conteo ya fue ajustado anteriormente');

      if (dto.estado === ConteoEstado.AJUSTADO) {
        if (!dto.data || dto.data.length === 0) {
          throw new Error(
            'Debe enviar el arreglo de productos contados (data).',
          );
        }

        const conteoFisicoMap = new Map(
          dto.data.map((item) => [item.id_detalle, item.stock_conteo]),
        );

        for (const det of conteo.detalles) {
          const stockIngresado = conteoFisicoMap.get(det.idDetalle);

          if (stockIngresado !== undefined) {
            det.stockConteo = stockIngresado;
            const diff = Number(det.stockConteo) - Number(det.stockSistema);
            det.diferencia = diff;

            await manager.save(det);

            if (diff !== 0) {
              const tipoMov = diff > 0 ? 501 : 502;

              const movimiento = manager.create(InventoryMovementOrmEntity, {
                idProducto: det.idProducto,
                idSede: det.idSedeRef,
                idAlmacen: det.idAlmacen,
                quantity: Math.abs(diff),
                typeMovement: tipoMov,
                userRef: conteo.usuarioCreacionRef,
                date: new Date(),
              });
              await manager.save(movimiento);

              await manager.update(StockOrmEntity, det.idStock, {
                cantidad: det.stockConteo,
              });
            }
          }
        }
        conteo.estado = ConteoEstado.AJUSTADO;
      } else {
        conteo.estado = ConteoEstado.ANULADO;
      }

      conteo.fechaFin = new Date();
      conteo.totalDiferencias = dto.total_diferencias || 0;
      conteo.totalItems = dto.total_items || conteo.detalles.length;

      return await manager.save(conteo);
    });
  }

  async registrarConteoFisico(
    idDetalle: number,
    dto: ActualizarDetalleConteoDto,
  ) {
    const detalle = await this.dataSource
      .getRepository(ConteoInventarioDetalleOrmEntity)
      .findOneBy({ idDetalle });

    if (!detalle) throw new Error('Detalle no encontrado');

    detalle.stockConteo = Number(dto.stockConteo);
    detalle.diferencia = detalle.stockConteo - detalle.stockSistema;
    detalle.observacion = dto.observacion;
    detalle.estado = 2;

    return await this.dataSource
      .getRepository(ConteoInventarioDetalleOrmEntity)
      .save(detalle);
  }
}
