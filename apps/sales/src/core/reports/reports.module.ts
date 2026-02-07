import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './application/service/reports.service';
import { ReportsTypeOrmRepository } from './infrastructure/adapters/out/repository/reports-typeorm.repository';
import { ReportsController } from './infrastructure/adapters/in/controllers/reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [ReportsController],
  providers: [
    {
      provide: 'ReportsService',
      useClass: ReportsService,
    },
    {
      provide: 'IReportsRepositoryPort',
      useClass: ReportsTypeOrmRepository,
    },
  ],
  exports: ['ReportsService'],
})
export class ReportsModule {}
