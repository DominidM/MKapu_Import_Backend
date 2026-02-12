import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WastageOrmEntity } from './infrastructure/entity/wastage-orm.entity';
import { WastageDetailOrmEntity } from './infrastructure/entity/wastage-detail.orm.entity';
import { WastageRestController } from './infrastructure/adapters/in/controllers/wastage-rest.controller';
import { WastageCommandService } from './application/service/wastage-command.service';
import { WastageQueryService } from './application/service/wastage-query.service';
import { WastageTypeOrmRepository } from './infrastructure/adapters/out/repository/wastage-typeorm.repository';
import { InventoryModule } from '../../warehouse/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WastageOrmEntity, WastageDetailOrmEntity]),
    InventoryModule,
  ],
  controllers: [WastageRestController],
  providers: [
    WastageCommandService,
    { provide: 'IWastageCommandPort', useClass: WastageCommandService },
    { provide: 'IWastageQueryPort', useClass: WastageQueryService },
    { provide: 'IWastageRepositoryPort', useClass: WastageTypeOrmRepository },
  ],
  exports: [WastageCommandService, 'IWastageCommandPort'],
})
export class WastageModule {}
