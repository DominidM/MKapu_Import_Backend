import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchOrmEntity } from './infrastructure/entity/dispatch-orm.entity';
import { DispatchCommandService } from './application/service/dispatch-command.service';
import { DispatchQueryService } from './application/service/dispatch-query.service';
import { DispatchRepository } from './infrastructure/adapters/out/repository/dispatch.repository';
import { DispatchRestController } from './infrastructure/adapters/in/controller/dispatch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DispatchOrmEntity])],
  controllers: [DispatchRestController],
  providers: [
    {
      provide: 'DispatchPortOut',
      useClass: DispatchRepository,
    },
    {
      provide: 'DispatchCommandPortIn',
      useClass: DispatchCommandService,
    },
    {
      provide: 'DispatchQueryPortIn',
      useClass: DispatchQueryService,
    },
  ],
  exports: ['DispatchCommandPortIn', 'DispatchQueryPortIn'],
})
export class DispatchModule {}
