/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UnitPortsOut } from 'apps/logistics/src/core/catalog/unit/application/port/out/unit-ports-out';
import {
  RequestTransferDto,
  TransferPortsIn,
} from '../../domain/ports/in/transfer-ports-in';
import {
  Transfer,
  TransferItem,
  TransferStatus,
} from '../../domain/entity/transfer-domain-entity';
import { TransferPortsOut } from '../../domain/ports/out/transfer-ports-out';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-intity';
import { TransferWebsocketGateway } from '../../infrastructure/adapters/out/transfer-websocket.gateway';
import { StockOrmEntity } from '../../../stock/infrastructure/entity/stock-orm-intity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryMovementCommandService } from '../../../inventory-movement/application/service/inventory-movement-command.service';

@Injectable()
export class TransferCommandService implements TransferPortsIn {
  constructor(
    @Inject('TransferPortsOut')
    private readonly transferRepo: TransferPortsOut,
    @Inject('UnitPortsOut')
    private readonly unitRepo: UnitPortsOut,
    private readonly transferGateway: TransferWebsocketGateway,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
    private readonly inventoryService: InventoryMovementCommandService,
  ) {}

  async requestTransfer(dto: RequestTransferDto): Promise<Transfer> {
    await this.validateWarehouseBelongsToHeadquarters(
      dto.originWarehouseId,
      dto.originHeadquartersId,
    );

    await this.validateWarehouseBelongsToHeadquarters(
      dto.destinationWarehouseId,
      dto.destinationHeadquartersId,
    );

    const allSeries = dto.items.flatMap((item) => item.series);
    const foundUnits = await this.unitRepo.findBySerials(allSeries);

    if (foundUnits.length !== allSeries.length) {
      throw new NotFoundException('Algunas series no existen.');
    }

    const invalidUnits = foundUnits.filter(
      (u) =>
        u.status !== UnitStatus.AVAILABLE ||
        u.warehouseId !== dto.originWarehouseId,
    );
    if (invalidUnits.length > 0) {
      throw new BadRequestException(
        `Series no disponibles en el almacén de origen.`,
      );
    }
    const transferItems = dto.items.map(
      (i) => new TransferItem(i.productId, i.series),
    );

    const transfer = new Transfer(
      dto.originHeadquartersId,
      dto.originWarehouseId,
      dto.destinationHeadquartersId,
      dto.destinationWarehouseId,
      transferItems,
      dto.observation,
      undefined,
      TransferStatus.REQUESTED,
    );

    const savedTransfer = await this.transferRepo.save(transfer);

    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateStatusBySerial(serie, UnitStatus.TRANSFERRING),
      ),
    );

    this.transferGateway.notifyNewRequest(dto.destinationHeadquartersId, {
      id: savedTransfer.id,
      origin: dto.originHeadquartersId,
      date: savedTransfer.requestDate,
    });

    return savedTransfer;
  }

  // CORREGIDO: Acepta userId
  async approveTransfer(transferId: number, userId: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);

    if (!transfer) throw new NotFoundException('Transferencia no encontrada');

    transfer.approve();

    // 1. REGISTRAR SALIDA (Kardex)
    await this.inventoryService.registerExit({
      refId: transfer.id!,
      refTable: 'transferencia',
      observation: `Salida por transferencia #${transfer.id} hacia Sede ${transfer.destinationHeadquartersId} (Aprobado por usuario ${userId})`,
      items: transfer.items.map((i) => ({
        productId: i.productId,
        warehouseId: transfer.originWarehouseId,
        quantity: i.quantity,
      })),
    });

    const savedTransfer = await this.transferRepo.save(transfer);

    this.transferGateway.notifyStatusChange(transfer.originHeadquartersId, {
      id: savedTransfer.id,
      status: TransferStatus.APPROVED,
    });

    return savedTransfer;
  }

  async rejectTransfer(
    transferId: number,
    userId: number,
    reason: string,
  ): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);

    if (!transfer) throw new NotFoundException('Transferencia no encontrada');

    transfer.reject(reason);

    const allSeries = transfer.items.flatMap((i) => i.series);

    // CORREGIDO: Solo desbloqueamos (ponemos AVAILABLE).
    // NO movemos la ubicación ni registramos ingreso, porque nunca salió.
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateStatusBySerial(serie, UnitStatus.AVAILABLE),
      ),
    );

    const savedTransfer = await this.transferRepo.save(transfer);

    this.transferGateway.notifyStatusChange(transfer.originHeadquartersId, {
      id: savedTransfer.id,
      status: TransferStatus.REJECTED,
      reason,
    });

    return savedTransfer;
  }

  // CORREGIDO: Acepta userId
  async confirmReceipt(transferId: number, userId: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');

    transfer.complete();

    const allSeries = transfer.items.flatMap((i) => i.series);

    // 2. MOVER UNIDADES Y PONER DISPONIBLES
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateLocationAndStatusBySerial(
          serie,
          transfer.destinationWarehouseId,
          UnitStatus.AVAILABLE,
        ),
      ),
    );

    // 3. REGISTRAR INGRESO (Kardex) - MOVIDO AQUÍ (Estaba en reject por error)
    await this.inventoryService.registerIncome({
      refId: transfer.id!,
      refTable: 'transferencia',
      observation: `Ingreso por recepción de transferencia #${transfer.id} desde Sede ${transfer.originHeadquartersId} (Confirmado por usuario ${userId})`,
      items: transfer.items.map((i) => ({
        productId: i.productId,
        warehouseId: transfer.destinationWarehouseId,
        quantity: i.quantity,
      })),
    });

    return await this.transferRepo.save(transfer);
  }

  getTransfersByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    return this.transferRepo.findByHeadquarters(headquartersId);
  }

  async getTransferById(id: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    return transfer;
  }

  private async validateWarehouseBelongsToHeadquarters(
    warehouseId: number,
    headquartersId: string,
  ): Promise<void> {
    const relation = await this.stockRepo.findOne({
      where: {
        id_almacen: warehouseId,
        id_sede: headquartersId,
      },
    });
    if (!relation) {
      const otherOwner = await this.stockRepo.findOne({
        where: { id_almacen: warehouseId },
      });
      if (otherOwner && otherOwner.id_sede !== headquartersId) {
        throw new BadRequestException(
          `El almacén ${warehouseId} no pertenece a la sede ${headquartersId} (Pertenece a ${otherOwner.id_sede})`,
        );
      }
    }
  }
}
