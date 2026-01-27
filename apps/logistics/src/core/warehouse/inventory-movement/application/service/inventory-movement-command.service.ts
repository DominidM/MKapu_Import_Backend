import { Inject, Injectable } from '@nestjs/common';
import { InventoryMovementPortsOut } from '../../domain/ports/out/inventory-movement-ports-out';
import { RegisterMovementDto } from '../dto/in/register-movement.dto';
import { StockService } from '../../../stock/application/service/stock.service';
import { InventoryMovementPortsIn } from '../../domain/ports/in/inventory-movement-ports-in.';

@Injectable()
export class InventoryMovementCommandService implements InventoryMovementPortsIn {
  constructor(
    @Inject('InventoryMovementPortsOut')
    private readonly repository: InventoryMovementPortsOut,
    private readonly stockService: StockService,
  ) {}
  async registerIncome(dto: RegisterMovementDto): Promise<void> {
    await this.repository.save({
      originType: 'TRANSFERENCIA',
      refId: dto.refId,
      refTable: dto.refTable,
      observation: dto.observation,
      items: dto.items.map((item) => ({
        ...item,
        type: 'INGRESO',
      })),
    });
  }
  async registerExit(dto: RegisterMovementDto): Promise<void> {
    await this.repository.save({
      originType: 'TRANSFERENCIA',
      refId: dto.refId,
      refTable: dto.refTable,
      observation: dto.observation,
      items: dto.items.map((item) => ({
        ...item,
        type: 'SALIDA',
      })),
    });
  }
}
