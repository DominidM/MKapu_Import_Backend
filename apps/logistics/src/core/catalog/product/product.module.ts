import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductOrmEntity } from './infrastructure/entity/product-orm.entity';
import { ProductRestController } from './infrastructure/adapters/in/controllers/product-rest.controller';
import { ProductWebSocketGateway } from './infrastructure/adapters/out/product-websocket.gateway';

import { ProductCommandService } from './application/service/product-command.service';
import { ProductQueryService } from './application/service/product-query.service';

import { ProductTypeOrmRepository } from './infrastructure/adapters/out/repository/product.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductOrmEntity]),
  ],
  controllers: [ProductRestController],
  providers: [
    ProductWebSocketGateway,

    ProductCommandService,
    ProductQueryService,

    {
      provide: 'IProductRepositoryPort',
      useClass: ProductTypeOrmRepository,
    },
  ],
  exports: [
    ProductCommandService,
    ProductQueryService,
  ],
})
export class ProductModule {}
