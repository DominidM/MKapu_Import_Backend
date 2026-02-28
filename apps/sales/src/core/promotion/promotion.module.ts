/* marketing/src/core/promotion/promotion.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionOrmEntity } from './infrastructure/entity/promotion-orm.entity';
import { PromotionCommandService } from './application/service/promotion-command.service';
import { PromotionQueryService } from './application/service/promotion-query.service';
import { PromotionRepository } from './infrastructure/adapters/out/repository/promotion.repository';
import { PromotionRestController } from './infrastructure/adapters/in/controllers/promotion-rest.controller';
import { DiscountAppliedOrmEntity } from './infrastructure/entity/discount_applied-orm.entity';
import { DiscountOrmEntity } from '../discount/infrastructure/entity/discount-orm.entity';
import { PromotionRuleOrmEntity } from './infrastructure/entity/promotion_rule-orm.entity';

@Module({
  imports: [TypeOrmModule.forFeature(
    [
      PromotionOrmEntity,
      DiscountAppliedOrmEntity,
      PromotionRuleOrmEntity,
      DiscountOrmEntity
    ])],
  controllers: [PromotionRestController],
  providers: [
    // Servicios
    PromotionCommandService,
    PromotionQueryService,
    
    // Repositorio
    PromotionRepository,
    
    // Inyección de dependencias por token
    {
      provide: 'IPromotionCommandPort',
      useClass: PromotionCommandService,
    },
    {
      provide: 'IPromotionQueryPort',
      useClass: PromotionQueryService,
    },
    {
      provide: 'IPromotionRepositoryPort',
      useClass: PromotionRepository,
    },
  ],
  exports: [
    PromotionCommandService, 
    PromotionQueryService,
  ],
})
export class PromotionModule {}