/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
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
} from '../../domain/entity/transfer-domain-entity';
import { TransferPortsOut } from '../../domain/ports/out/transfer-ports-out';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-intity';

@Injectable()
export class TransferCommandService implements TransferPortsIn {
  constructor(
    @Inject('TransferPortsOut')
    private readonly transferRepo: TransferPortsOut,
    @Inject('UnitPortsOut')
    private readonly unitRepo: UnitPortsOut,
  ) {}
  async requestTransfer(dto: RequestTransferDto): Promise<Transfer> {
    const allSeries = dto.items.flatMap((item) => item.series);
    const foundUnits = await this.unitRepo.findBySerials(allSeries);
    if (foundUnits.length !== allSeries.length) {
      const foundSNs = foundUnits.map((u) => u.serialNumber);

      const missing = allSeries.filter((sn) => !foundSNs.includes(sn));
      throw new NotFoundException(
        `Las siguientes series no se encontraron: ${missing.join(', ')}`,
      );
    }
    const invalidUnits = foundUnits.filter(
      (u) =>
        u.status !== UnitStatus.AVAILABLE ||
        u.warehouseId !== dto.originWarehouseId,
    );
    if (invalidUnits.length > 0) {
      throw new BadRequestException(
        `Some units are not available or not in the origin warehouse: ${invalidUnits}`,
      );
    }
    const transferItems = dto.items.map(
      (item) => new TransferItem(item.productId, item.series),
    );
    const transfer = new Transfer(
      dto.originHeadquartersId,
      dto.originWarehouseId,
      dto.destinationHeadquartersId,
      dto.destinationWarehouseId,
      transferItems,
      dto.observation,
    );
    const savedTransfer = await this.transferRepo.save(transfer);
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateStatusBySerial(serie, UnitStatus.TRANSFERRING),
      ),
    );
    return savedTransfer;
  }
  async approveTransfer(transferId: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    transfer.approve();
    return await this.transferRepo.save(transfer);
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
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateStatusBySerial(serie, UnitStatus.AVAILABLE),
      ),
    );
    return await this.transferRepo.save(transfer);
  }
  async confirmReceipt(transferId: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    transfer.complete();
    const allSeries = transfer.items.flatMap((i) => i.series);
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateLocationAndStatusBySerial(
          serie,
          transfer.destinationWarehouseId,
          UnitStatus.AVAILABLE,
        ),
      ),
    );
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
}
