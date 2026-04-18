// product.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ProductOrmEntity } from './infrastructure/entity/product-orm.entity';
import { CategoryOrmEntity } from './infrastructure/entity/category-orm.entity';
import { WarehouseOrmEntity } from '../../warehouse/infrastructure/entity/warehouse-orm.entity';
import { UnidadOrmEntity } from './infrastructure/entity/unidad-orm.entity';
import { StockOrmEntity } from '../../warehouse/inventory/infrastructure/entity/stock-orm-entity';
import { CajaOrmEntity } from './infrastructure/entity/caja-orm-entity';

import { ProductTypeOrmRepository } from './infrastructure/adapters/out/repository/product-typeorm.repository';
import { CajaTypeOrmRepository } from './infrastructure/adapters/out/repository/caja.typeorm.repository';

import { ProductRestController } from './infrastructure/adapters/in/controllers/product-rest.controller';
import { ProductStockTcpController } from './infrastructure/adapters/in/TCP/product-stock-tcp.controller';
import { CajaRestController } from './infrastructure/adapters/in/controllers/caja-rest.controller';

import { ProductPricesTcpController } from './infrastructure/adapters/in/TCP/product-prices-tcp.controller';

import { ProductWebSocketGateway } from './infrastructure/adapters/out/product-websocket.gateway';
import { SedeTcpProxy } from './infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { InventoryModule } from '../../warehouse/inventory/inventory.module';

import { ProductCommandService } from './application/service/command/product-command.service';
import { ProductQueryService } from './application/service/query/product-query.service';
import { CajaCommandService } from './application/service/command/caja-command.service';
import { CajaQueryService } from './application/service/query/caja-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductOrmEntity,
      StockOrmEntity,
      CajaOrmEntity,
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

  controllers: [
    ProductRestController,
    ProductStockTcpController,
    CajaRestController,
  ],

  providers: [
    // Product
    ProductTypeOrmRepository,
    {
      provide: 'IProductRepositoryPort',
      useExisting: ProductTypeOrmRepository,
    },
    ProductQueryService,
    ProductCommandService,

    // Caja
    CajaTypeOrmRepository,
    CajaCommandService,
    CajaQueryService,

    ProductWebSocketGateway,
    SedeTcpProxy,


    
  ],

  exports: [
    ProductQueryService,
    ProductCommandService,
    CajaQueryService,
    CajaCommandService,
  ],
})
export class ProductModule {}
