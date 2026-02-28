import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountOrmEntity } from './infrastructure/entity/discount-orm.entity';
import { DiscountCommandService } from './application/service/discount-command.service';
import { DiscountQueryService } from './application/service/discount-query.service';
import { DiscountRepository } from './infrastructure/adapters/out/repository/discount.repository';
import { DiscountRestController } from './infrastructure/adapters/in/controllers/discount-rest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountOrmEntity])],
  controllers: [DiscountRestController],
  providers: [
    DiscountCommandService,
    DiscountQueryService,
    {
      provide: 'IDiscountRepositoryPort',
      useClass: DiscountRepository,
    },
    {
      provide: 'IDiscountCommandPort',
      useClass: DiscountCommandService,
    },
    {
      provide: 'IDiscountQueryPort',
      useClass: DiscountQueryService,
    },
  ],
  exports: [
    DiscountCommandService,
    DiscountQueryService,
  ],
})
export class DiscountModule {}
