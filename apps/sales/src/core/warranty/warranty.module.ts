import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { WarrantyRestController } from './infrastructure/adapters/in/warranty-rest.controller';
import { InventoryMessageController } from './infrastructure/adapters/in/inventory-message.controller';

// Services
import { WarrantyCommandService } from './application/service/warranty-command.service';
import { WarrantyQueryService } from './application/service/warranty-query.service';

// Adapters (out)
import { WarrantyRepository } from './infrastructure/adapters/out/warranty.repository';
import { WarrantySalesAdapter } from './infrastructure/adapters/out/warranty-sales.adapter';
import { WarrantyLogisticsAdapter } from './infrastructure/adapters/out/warranty-logistics.adapter';

// Mapper
import { WarrantyMapper } from './application/mapper/warranty.mapper';

// ORM Entities
import { WarrantyOrmEntity } from './infrastructure/entity/warranty-orm-entity';
import { WarrantyDetailOrmEntity } from './infrastructure/entity/warranty-detail-orm.entity';
import { WarrantyStatusOrmEntity } from './infrastructure/entity/warranty-status-orm.entity';
import { WarrantyTrackingOrmEntity } from './infrastructure/entity/warranty-tracking-orm.entity';
import { SalesReceiptModule } from '../sales-receipt/sales-receipt.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarrantyOrmEntity,
      WarrantyDetailOrmEntity,
      WarrantyStatusOrmEntity,
      WarrantyTrackingOrmEntity,
    ]),
    SalesReceiptModule,
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'LOGISTICS_SERVICE',  
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('LOGISTICS_HOST', 'localhost'),
            port: config.get<number>('LOGISTICS_TCP_PORT', 3004),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    WarrantyRestController,
    InventoryMessageController,
  ],
  providers: [
    WarrantyCommandService,
    WarrantyQueryService,
    WarrantyMapper,
    WarrantyRepository,
    WarrantySalesAdapter,
    WarrantyLogisticsAdapter,
    {
      provide: 'IWarrantyRepositoryPort',
      useClass: WarrantyRepository,
    },
    {
      provide: 'ISalesReceiptRepositoryPort',
      useClass: WarrantySalesAdapter,
    },
    {
      provide: 'IWarrantyLogisticsPort',
      useClass: WarrantyLogisticsAdapter,
    },
    {
      provide: 'IWarrantySalesPort',
      useClass: WarrantySalesAdapter,
    },
  ],
  exports: [
    WarrantyCommandService,
    WarrantyQueryService,
  ],
})
export class WarrantyModule {}