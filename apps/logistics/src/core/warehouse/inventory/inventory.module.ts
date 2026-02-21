import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryMovementOrmEntity } from './infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './infrastructure/entity/inventory-movement-detail-orm.entity';
import { StockOrmEntity } from './infrastructure/entity/stock-orm-entity';
import { WarehouseOrmEntity } from '../infrastructure/entity/warehouse-orm.entity';

import { InventoryCommandService } from './application/service/inventory-command.service';
import { UnitSeriesGeneratorService } from './application/service/unit-series-generator.service';
import { InventoryTypeOrmRepository } from './infrastructure/adapters/out/repository/inventory-typeorm.repository';
import { UnitSeriesTypeOrmRepository } from './infrastructure/adapters/out/repository/unit-series-typeorm.repository';
import { InventoryMovementRestController } from './infrastructure/adapters/in/controllers/inventory-rest.controller';
import { InventoryUnitsRestController } from './infrastructure/adapters/in/controllers/inventory-units-rest.controller';
import { InventoryQueryService } from './application/service/inventory-query.service';
import { UnitOrmEntity } from '../../catalog/unit/infrastructure/entity/unit-orm.entity';
import { UnitLockerRepository } from '../transfer/infrastructure/adapters/out/unit-locker.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovementOrmEntity,
      InventoryMovementDetailOrmEntity,
      StockOrmEntity,
      WarehouseOrmEntity,
      UnitOrmEntity,
    ]),
  ],
  controllers: [InventoryMovementRestController, InventoryUnitsRestController],
  providers: [
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
  ],
})
export class InventoryModule {}
