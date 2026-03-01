import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './application/service/reports.service';
import { ReportsTypeOrmRepository } from './infrastructure/adapters/out/repository/reports-typeorm.repository';
import { ReportsController } from './infrastructure/adapters/in/controllers/reports.controller';

// ⚠️ Importa tus entidades aquí (Ajusta las rutas si es necesario)
import { SalesReceiptOrmEntity } from '../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { CustomerOrmEntity } from '../customer/infrastructure/entity/customer-orm.entity';
import { PaymentOrmEntity } from '../sales-receipt/infrastructure/entity/payment-orm.entity';

@Module({
  imports: [
    // 1. REGISTRAR LAS ENTIDADES AQUÍ
    TypeOrmModule.forFeature([
      SalesReceiptOrmEntity,
      CustomerOrmEntity,
      PaymentOrmEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService, // Declarado como provider normal por si lo inyectas directamente
    {
      provide: 'IReportsRepositoryPort',
      useClass: ReportsTypeOrmRepository,
    },
    {
      provide: 'IReportsUseCase',
      useClass: ReportsService,
    },
  ],
  exports: [ReportsService, 'IReportsUseCase'],
})
export class ReportsModule {}
