import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './application/service/stock.service';
import { StockRepository } from './infrastructure/adapters/out/repository/stock.repository';
import { StockOrmEntity } from './infrastructure/entity/stock-orm-intity';
import { StockController } from './infrastructure/adapters/in/controller/stock.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockOrmEntity])],
  controllers: [StockController],
  providers: [
    StockService,
    StockRepository,
    {
      provide: 'StockPortsOut',
      useClass: StockRepository,
    },
    StockRepository, // También lo agregamos directamente para que pueda ser inyectado
  ],
  exports: [StockService],
})
export class StockModule {}