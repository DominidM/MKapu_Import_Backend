import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferCommandService } from './application/service/transfer-command.service';
import { TransferRepository } from './infrastructure/adapters/out/repository/transfer.repository';
import { TransferOrmEntity } from './infrastructure/entity/transfer-orm.entity';
import { TransferDetailOrmEntity } from './infrastructure/entity/transfer-detail-orm.entity';
import { TransferWebsocketGateway } from './infrastructure/adapters/out/transfer-websocket.gateway';
import { StockOrmEntity } from '../inventory/infrastructure/entity/stock-orm-entity';
import { TransferRestController } from './infrastructure/adapters/in/controllers/transfer-rest.controller';
import { UnitModule } from '../../catalog/unit/unit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductOrmEntity } from '../../catalog/product/infrastructure/entity/product-orm.entity';
import { StoreOrmEntity } from '../store/infrastructure/entity/store-orm.entity';
import { UnitOrmEntity } from '../../catalog/unit/infrastructure/entity/unit-orm.entity';
import { UnitLockerRepository } from './infrastructure/adapters/out/unit-locker.repository';
import { UsersClientProvider } from './infrastructure/adapters/out/TCP/users-client.provider';
import { UsuarioTcpProxy } from './infrastructure/adapters/out/TCP/usuario-tcp.proxy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransferOrmEntity,
      TransferDetailOrmEntity,
      StockOrmEntity,
      ProductOrmEntity,
      StoreOrmEntity,
      UnitOrmEntity,
    ]),
    UnitModule,
    InventoryModule,
  ],
  controllers: [TransferRestController],
  providers: [
    TransferWebsocketGateway,
    UnitLockerRepository,
    UsersClientProvider,
    UsuarioTcpProxy,
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
