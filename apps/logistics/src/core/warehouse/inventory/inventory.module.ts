import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovementOrmEntity } from './infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './infrastructure/entity/inventory-movement-detail-orm.entity';
import { StockOrmEntity } from './infrastructure/entity/stock-orm-entity';
import { WarehouseOrmEntity } from '../infrastructure/entity/warehouse-orm.entity';
import { UnitSeriesGeneratorService } from './application/service/unit-series-generator.service';
import { InventoryCommandService } from './application/service/inventory/inventory-command.service';
import { InventoryTypeOrmRepository } from './infrastructure/adapters/out/repository/inventory-typeorm.repository';
import { UnitSeriesTypeOrmRepository } from './infrastructure/adapters/out/repository/unit-series-typeorm.repository';
import { InventoryMovementRestController } from './infrastructure/adapters/in/controllers/inventory-rest.controller';
import { InventoryUnitsRestController } from './infrastructure/adapters/in/controllers/inventory-units-rest.controller';
import { UnitOrmEntity } from '../../catalog/unit/infrastructure/entity/unit-orm.entity';
import { UnitLockerRepository } from '../transfer/infrastructure/adapters/out/unit-locker.repository';
import { ConteoInventarioOrmEntity } from './infrastructure/entity/inventory-count-orm.entity';
import { ConteoInventarioDetalleOrmEntity } from './infrastructure/entity/inventory-count-detail-orm.entity';
import { InventoryCountController } from './infrastructure/adapters/in/controllers/inventory-count.controller';
import { InventoryCountRepository } from './infrastructure/adapters/out/repository/inventory-count.repository';
import { InventoryCountCommandService } from './application/service/count/inventory-count-command.service';
import { InventoryCountQueryService } from './application/service/count/inventory-count-query.service';
import { InventoryQueryService } from './application/service/inventory/inventory-query.service';
import { SedeOrmEntity } from '../../catalog/product/infrastructure/entity/sede-orm.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductOrmEntity } from '../../catalog/product/infrastructure/entity/product-orm.entity';
import { CategoryOrmEntity } from '../../catalog/product/infrastructure/entity/category-orm.entity';
import { ProductModule } from '../../catalog/product/product.module';

@Module({
  imports: [
    forwardRef(() => ProductModule),
    ClientsModule.register([
      {
        name: 'ADMIN_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3011,
        },
      },
    ]),
    TypeOrmModule.forFeature([
      InventoryMovementOrmEntity,
      InventoryMovementDetailOrmEntity,
      ConteoInventarioOrmEntity,
      ConteoInventarioDetalleOrmEntity,
      StockOrmEntity,
      WarehouseOrmEntity,
      UnitOrmEntity,
      SedeOrmEntity,
      ProductOrmEntity,
      CategoryOrmEntity,
    ]),
  ],
  controllers: [InventoryMovementRestController, InventoryUnitsRestController, InventoryCountController],
  providers: [
    {
      provide: 'IInventoryMovementCommandPort',
      useClass: InventoryCommandService,
    },
    InventoryCommandService,
    UnitSeriesGeneratorService,
    InventoryQueryService,          
    InventoryTypeOrmRepository,
    UnitSeriesTypeOrmRepository,
    UnitLockerRepository,
    {
      provide: 'IInventoryRepositoryPort',
      useClass: InventoryTypeOrmRepository,
    },
    {
      provide: 'IUnitSeriesRepositoryPort',
      useClass: UnitSeriesTypeOrmRepository,
    },
    {
      provide: 'IInventoryCountRepository',
      useClass: InventoryCountRepository,
    },
    InventoryCountCommandService,
    InventoryCountQueryService,
  ],
  exports: [
    InventoryCommandService,
    UnitSeriesGeneratorService,
    InventoryQueryService,          
    InventoryTypeOrmRepository,
    UnitSeriesTypeOrmRepository,
    UnitLockerRepository,
    'IInventoryRepositoryPort',
    'IUnitSeriesRepositoryPort',
    'IInventoryCountRepository',
    InventoryCountCommandService,
    InventoryCountQueryService,
    InventoryTypeOrmRepository,
  ],
})
export class InventoryModule {}
