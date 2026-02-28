/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { IInventoryRepositoryPort } from '../../../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMovement } from '../../../../domain/entity/inventory-movement.entity';
import { Stock } from '../../../../domain/entity/stock-domain-entity';
import { InventoryMovementOrmEntity } from '../../../entity/inventory-movement-orm.entity';
import { StockOrmEntity } from '../../../entity/stock-orm-entity';
import { InventoryMovementResponseDto } from '../../../../application/dto/out/inventory-movement-response.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InventoryTypeOrmRepository implements IInventoryRepositoryPort {
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly movementRepo: Repository<InventoryMovementOrmEntity>,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
    @Inject('ADMIN_SERVICE') private readonly adminClient: ClientProxy,
  ) {}

  async saveMovement(movement: InventoryMovement): Promise<void> {
    const movementOrm = this.movementRepo.create({
      originType: movement.originType,
      refId: movement.refId,
      refTable: movement.refTable,
      observation: movement.observation,
      date: movement.date,
      details: movement.items.map((item) => ({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        type: item.type,
      })),
    });

    await this.movementRepo.save(movementOrm);

  }

  async findStock(
    productId: number,
    warehouseId: number,
  ): Promise<Stock | null> {
    const stockOrm = await this.stockRepo.findOne({
      where: { id_producto: productId, id_almacen: warehouseId },
    });

    if (!stockOrm) return null;

    return new Stock(
      stockOrm.id_stock,
      stockOrm.id_producto,
      stockOrm.id_almacen,
      stockOrm.id_sede,
      stockOrm.cantidad,
      stockOrm.tipo_ubicacion,
      stockOrm.estado,
    );
  }

  async updateStock(stock: Stock): Promise<void> {
    await this.stockRepo.update(stock.id, { cantidad: stock.quantity });
  }

  async findAllMovements(
    filters: any,
  ): Promise<{ data: InventoryMovementResponseDto[]; total: number }> {
    const query = this.movementRepo
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.details', 'det')
      .leftJoin('det.productRelation', 'prod')
      .addSelect([
        'prod.id_producto',
        'prod.codigo',
        'prod.descripcion',
        'prod.uni_med',
      ])
      .leftJoinAndSelect('det.warehouseRelation', 'wh')
      .orderBy('mov.date', 'DESC');

    if (filters.search) {
      query.andWhere(
        '(mov.observation LIKE :search OR mov.refTable LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.tipoId && filters.tipoId > 0) {
      if (filters.tipoId == 1) {
        query.andWhere('det.type = :type', { type: 'INGRESO' });
      } else if (filters.tipoId == 2) {
        query.andWhere('det.type = :type', { type: 'SALIDA' });
      } else if (filters.tipoId == 3) {
        query.andWhere('mov.originType = :otype', { otype: 'TRANSFERENCIA' });
      }
    }

    if (filters.fechaInicio && filters.fechaFin) {
      query.andWhere('mov.date BETWEEN :inicio AND :fin', {
        inicio: filters.fechaInicio,
        fin: filters.fechaFin,
      });
    }

    const [movements, total] = await query.getManyAndCount();
    const sedeIds = new Set<number>();

    movements.forEach((mov) => {
      mov.details.forEach((det) => {
        const rawId =
          det.warehouseRelation?.sedeId ??
          (det.warehouseRelation as any)?.id_sede;
        if (rawId !== undefined && rawId !== null) {
          sedeIds.add(Number(rawId));
        }
      });
    });

    let sedeMap: Record<number, string> = {};
    if (sedeIds.size > 0) {
      try {
        sedeMap = await firstValueFrom(
          this.adminClient.send('get_sedes_nombres', Array.from(sedeIds)),
        );
      } catch (error) {
        console.error('TCP Error:', error.message);
      }
    }

    const mappedData: InventoryMovementResponseDto[] = movements.map((mov) => {
      const detalleSalida = mov.details.find((d) => d.type === 'SALIDA');
      const detalleIngreso = mov.details.find((d) => d.type === 'INGRESO');

      const whSalidaNombre =
        detalleSalida?.warehouseRelation?.nombre ||
        (detalleSalida?.warehouseRelation as any)?.descripcion;

      const whIngresoNombre =
        detalleIngreso?.warehouseRelation?.nombre ||
        (detalleIngreso?.warehouseRelation as any)?.descripcion;

      let origenNombre = 'N/A';
      let destinoNombre = 'N/A';

      switch (mov.originType) {
        case 'TRANSFERENCIA':
          origenNombre = whSalidaNombre || 'Desconocido';
          destinoNombre = whIngresoNombre || 'En Tránsito';
          break;
        case 'COMPRA':
          origenNombre = 'Proveedor (Externo)';
          destinoNombre = whIngresoNombre || 'N/A';
          break;
        case 'VENTA':
          origenNombre = whSalidaNombre || 'N/A';
          destinoNombre = 'Cliente (Externo)';
          break;
        case 'AJUSTE':
          origenNombre = whSalidaNombre ? whSalidaNombre : 'Ajuste Manual';
          destinoNombre = whIngresoNombre ? whIngresoNombre : 'Ajuste Manual';
          break;
      }

      const idSedeInvolucrada =
        detalleSalida?.warehouseRelation?.sedeId ??
        (detalleSalida?.warehouseRelation as any)?.id_sede ??
        detalleIngreso?.warehouseRelation?.sedeId ??
        (detalleIngreso?.warehouseRelation as any)?.id_sede;

      const sedeNombre =
        idSedeInvolucrada !== undefined && idSedeInvolucrada !== null
          ? sedeMap[idSedeInvolucrada] ||
            sedeMap[idSedeInvolucrada.toString()] ||
            'Sede No Encontrada'
          : 'Sin Sede';

      const detallesUnicos = [];
      const mapProductos = new Map();

      mov.details.forEach((det) => {
        const idDelProducto = det.productRelation?.id_producto || det.productId;

        if (idDelProducto && !mapProductos.has(idDelProducto)) {
          mapProductos.set(idDelProducto, true);

          detallesUnicos.push({
            id: det.id,
            productoId: idDelProducto,
            codigo:
              det.productRelation?.codigo ||
              (det.productRelation ? 'S/C' : 'ERR_REL'),
            productoNombre:
              det.productRelation?.descripcion ||
              det.productRelation?.codigo ||
              `ID: ${idDelProducto}`,
            cantidad: det.quantity,
            unidadMedida: det.productRelation?.uni_med || 'UND',
            tipoOperacionItem: det.type,
          });
        }
      });

      return {
        id: mov.id,
        tipoMovimiento: mov.originType,
        fechaMovimiento: mov.date,
        motivo: mov.observation || 'Sin observación',
        documentoReferencia: mov.refTable
          ? `${mov.refTable} #${mov.refId}`
          : 'N/A',
        usuario: 'Sistema',
        almacenOrigenNombre: origenNombre,
        almacenDestinoNombre: destinoNombre,
        sedeNombre: sedeNombre,
        detalles: detallesUnicos,
      };
    });

    return { data: mappedData, total };
  }
}
