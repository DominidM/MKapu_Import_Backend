/* ============================================
   MODULE CONFIGURATION
   ============================================ */

/* ============================================
   sales/src/core/customer/customer.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomerOrmEntity } from './infrastructure/entity/customer-orm.entity';
import { CustomerRestController } from './infrastructure/adapters/in/controllers/customer-rest.controller';

import { CustomerCommandService } from './application/service/customer-command.service';
import { CustomerQueryService } from './application/service/customer-query.service';

import { CustomerRepository } from './infrastructure/adapters/out/repository/customer.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerOrmEntity]),
  ],
  controllers: [CustomerRestController],
  providers: [
    // Command Service
    {
      provide: 'ICustomerCommandPort',
      useClass: CustomerCommandService,
    },
    CustomerCommandService,

    // Query Service
    {
      provide: 'ICustomerQueryPort',
      useClass: CustomerQueryService,
    },
    CustomerQueryService,

    // Repository
    {
      provide: 'ICustomerRepositoryPort',
      useClass: CustomerRepository,
    },
  ],
  exports: [
    'ICustomerCommandPort',
    'ICustomerQueryPort',
    CustomerCommandService,
    CustomerQueryService,
  ],
})
export class CustomerModule {}