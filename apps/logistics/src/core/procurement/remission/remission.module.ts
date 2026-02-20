import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RemissionOrmEntity } from './infrastructure/entity/remission-orm.entity';
import { RemissionDetailOrmEntity } from './infrastructure/entity/remission-detail-orm.entity';

import { RemissionTypeormRepository } from './infrastructure/adapters/out/repository/remission-typeorm.repository';
// Controller y Service
import { RemissionCommandService } from './application/service/remission-command.service';
import { RemissionController } from './infrastructure/adapters/in/controller/remission.controller';
import { CarrierOrmEntity } from './infrastructure/entity/carrier-orm.entity';
import { DriverOrmEntity } from './infrastructure/entity/driver-orm.entity';
import { GuideTransferOrm } from './infrastructure/entity/transport_guide-orm.entity';
import { UbigeoOrmEntity } from './infrastructure/entity/ubigeo-orm.entity';
import { VehiculoOrmEntity } from './infrastructure/entity/vehicle-orm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RemissionOrmEntity,
      RemissionDetailOrmEntity,
      CarrierOrmEntity,
      DriverOrmEntity,
      GuideTransferOrm,
      UbigeoOrmEntity,
      VehiculoOrmEntity,
    ]),
  ],
  controllers: [RemissionController],
  providers: [
    RemissionCommandService,
    // LA MAGIA DEL REPOSITORIO:
    {
      provide: 'RemissionPortOut',
      useClass: RemissionTypeormRepository,
    },
  ],
  exports: [],
})
export class RemissionModule {}
