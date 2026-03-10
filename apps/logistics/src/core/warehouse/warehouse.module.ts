import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Entidades ─────────────────────────────────────────────────────
import { WarehouseOrmEntity } from './infrastructure/entity/warehouse-orm.entity';
import { StockOrmEntity } from './inventory/infrastructure/entity/stock-orm-entity';
import { InventoryMovementOrmEntity } from './inventory/infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './inventory/infrastructure/entity/inventory-movement-detail-orm.entity';
import { ProductOrmEntity } from '../catalog/product/infrastructure/entity/product-orm.entity';

// ── Controllers ───────────────────────────────────────────────────
import { WarehouseRestController } from './infrastructure/adapters/in/controllers/warehouse-rest.controller';
import { WarehouseTcpController } from './infrastructure/adapters/in/TCP/warehouse-tcp.controller';
import { WarehouseReportsController } from './infrastructure/adapters/in/controllers/warehouse-reports.controller';

// ── Services ──────────────────────────────────────────────────────
import { WarehouseQueryService } from './application/service/warehouse-query.service';
import { WarehouseCommandService } from './application/service/warehouse-command.service';

// ── Repositories ──────────────────────────────────────────────────
import { WarehouseTypeormRepository } from './infrastructure/adapters/out/repository/warehouse.repository';
import { IWarehouseRepository } from './domain/ports/out/warehouse-ports-out';
import { WAREHOUSE_REPORTS_PORT_OUT } from './domain/ports/out/warehouse-reports.port.out';
import { WarehouseReportsTypeormRepository } from './infrastructure/adapters/out/repository/warehouse-reports-typeorm.repository';
import { WarehouseReportsQueryService } from './application/service/warehouse-reports-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarehouseOrmEntity,
      StockOrmEntity,
      InventoryMovementOrmEntity,
      InventoryMovementDetailOrmEntity,
      ProductOrmEntity, // requerido por las relaciones @ManyToOne en las entidades de inventario
    ]),
  ],
  controllers: [
    WarehouseRestController,
    WarehouseTcpController,
    WarehouseReportsController,
  ],
  providers: [
    WarehouseQueryService,
    WarehouseCommandService,
    WarehouseTypeormRepository,
    WarehouseReportsQueryService,
    {
      provide: IWarehouseRepository,
      useClass: WarehouseTypeormRepository,
    },
    {
      provide: WAREHOUSE_REPORTS_PORT_OUT,
      useClass: WarehouseReportsTypeormRepository,
    },
  ],
  exports: [WarehouseQueryService, WarehouseCommandService],
})
export class WarehouseModule {}
