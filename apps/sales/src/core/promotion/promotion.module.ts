/* marketing/src/core/promotion/promotion.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionOrmEntity } from './infrastructure/entity/promotion-orm.entity';
import { PromotionCommandService } from './application/service/promotion-command.service';
import { PromotionQueryService } from './application/service/promotion-query.service';
import { PromotionRepository } from './infrastructure/adapters/out/repository/promotion.repository';
import { PromotionRestController } from './infrastructure/adapters/in/controllers/promotion-rest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PromotionOrmEntity])],
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