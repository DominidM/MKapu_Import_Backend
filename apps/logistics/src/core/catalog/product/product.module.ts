import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ProductOrmEntity } from './infrastructure/entity/product-orm.entity';
import { CategoryOrmEntity } from './infrastructure/entity/category-orm.entity';
import { WarehouseOrmEntity } from '../../warehouse/infrastructure/entity/warehouse-orm.entity';
import { UnidadOrmEntity } from './infrastructure/entity/unidad-orm.entity';

import { ProductTypeOrmRepository } from './infrastructure/adapters/out/repository/product-typeorm.repository';

import { ProductQueryService } from './application/service/product-query.service';
import { ProductCommandService } from './application/service/product-command.service';

import { ProductRestController } from './infrastructure/adapters/in/controllers/product-rest.controller';

import { ProductWebSocketGateway } from './infrastructure/adapters/out/product-websocket.gateway';
import { SedeTcpProxy } from './infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { StockOrmEntity } from '../../warehouse/inventory/infrastructure/entity/stock-orm-entity';
import { InventoryModule } from '../../warehouse/inventory/inventory.module';
import { ProductStockTcpController } from './infrastructure/adapters/in/TCP/product-stock-tcp.controller';

@Module({
  imports: [
    // Registrar entities de TypeORM
    TypeOrmModule.forFeature([
      ProductOrmEntity,
      StockOrmEntity,
      CategoryOrmEntity,
      WarehouseOrmEntity,
      UnidadOrmEntity,
    ]),
    forwardRef(() => InventoryModule),
    InventoryModule,
    ClientsModule.register([
      {
        name: 'SEDE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.SEDE_SERVICE_HOST || 'localhost',
          port: Number(process.env.SEDE_SERVICE_PORT || 3011),
        },
      },
    ]),
  ],

  controllers: [ProductRestController, ProductStockTcpController],

  providers: [
    ProductTypeOrmRepository,
    {
      provide: 'IProductRepositoryPort',
      useExisting: ProductTypeOrmRepository,
    },

    ProductQueryService,
    ProductCommandService,

    ProductWebSocketGateway,
    SedeTcpProxy,
  ],

  exports: [ProductQueryService, ProductCommandService],
})
export class ProductModule {}
