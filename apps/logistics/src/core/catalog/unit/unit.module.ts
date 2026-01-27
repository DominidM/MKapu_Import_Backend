import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOrmEntity } from './infrastructure/entity/unit-orm.entity';
import { UnitRepository } from './infrastructure/adapters/out/unit.repository';
// Si tienes un controller o service propios de Unit, impórtalos también
// import { UnitRestController } from './infrastructure/adapters/in/controllers/unit-rest.controller';
// import { UnitCommandService } from './application/service/unit-command.service';

@Module({
  imports: [TypeOrmModule.forFeature([UnitOrmEntity])],
  controllers: [],
  providers: [
    {
      provide: 'UnitPortsOut',
      useClass: UnitRepository,
    },
  ],
  exports: ['UnitPortsOut', TypeOrmModule],
})
export class UnitModule {}
