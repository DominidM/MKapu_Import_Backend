import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferCommandService } from './application/service/transfer-command.service';
import { TransferRepository } from './infrastructure/adapters/out/repository/transfer.repository';
import { TransferOrmEntity } from './infrastructure/entity/transfer-orm.entity';
import { TransferDetailOrmEntity } from './infrastructure/entity/transfer-detail-orm.entity';
import { TransferWebsocketGateway } from './infrastructure/adapters/out/transfer-websocket.gateway';
import { InventoryMovementModule } from '../inventory-movement/inventory-movement.module';
import { StockModule } from '../stock/stock.module';
import { StockOrmEntity } from '../stock/infrastructure/entity/stock-orm-intity';
import { TransferRestController } from './infrastructure/adapters/in/controllers/transfer-rest.controller';
import { UnitModule } from '../../catalog/unit/unit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransferOrmEntity,
      TransferDetailOrmEntity,
      StockOrmEntity,
    ]),
    UnitModule,
    InventoryMovementModule,
    StockModule,
  ],
  controllers: [TransferRestController],
  providers: [
    TransferWebsocketGateway,
    {
      provide: 'TransferPortsIn',
      useClass: TransferCommandService,
    },
    {
      provide: 'TransferPortsOut',
      useClass: TransferRepository,
    },
  ],
  exports: ['TransferPortsIn'],
})
export class TransferModule {}
