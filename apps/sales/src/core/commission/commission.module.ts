/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionController } from './infrastructure/adapters/in/controllers/commission.controller';
import { CommissionTcpController } from './infrastructure/adapters/in/TCP/commission-tcp.controller';
import { CommissionCommandService } from './application/service/commission-command.service';
import { CommissionQueryService } from './application/service/commission-query.service';
import { CommissionSchedulerService } from './application/service/commission-scheduler.service';
import { CommissionRepository } from './infrastructure/adapters/out/repository/commission.repository';
import { COMMISSION_REPOSITORY } from './domain/ports/out/commission-repository.port';
import { CommissionRuleOrmEntity } from './infrastructure/entity/commission-rule-orm.entity';
import { CommissionOrmEntity } from './infrastructure/entity/commission-orm.entity';
import { SalesReceiptModule } from '../sales-receipt/sales-receipt.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      CommissionRuleOrmEntity,
      CommissionOrmEntity,
    ]),
    forwardRef(() => SalesReceiptModule),
  ],
  controllers: [CommissionController, CommissionTcpController],
  providers: [
    CommissionCommandService,
    CommissionQueryService,
    CommissionSchedulerService,
    {
      provide: COMMISSION_REPOSITORY,
      useClass: CommissionRepository,
    },
  ],
  exports: [CommissionQueryService, CommissionCommandService],
})
export class CommissionModule {}