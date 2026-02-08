import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimOrmEntity } from './infrastructure/entity/claim-orm.entity';
import { SalesReceiptOrmEntity } from '../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { ClaimRestController } from './infrastructure/adapters/in/controllers/claims.controller';
import {
  CLAIM_COMMAND_PORT,
  CLAIM_QUERY_PORT,
} from './domain/ports/in/claim-port-in';
import { ClaimTypeormRepository } from './infrastructure/adapters/out/repository/claim-typeorm.repository';
import { ClaimCommandService } from './application/service/claim-command.service';
import { ClaimQueryService } from './application/service/claim-query.service';
import { CLAIM_PORT_OUT } from './domain/ports/out/claim-port-out';
import { ClaimDetailOrmEntity } from './infrastructure/entity/claim-detail-orm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClaimOrmEntity,
      SalesReceiptOrmEntity,
      ClaimDetailOrmEntity,
    ]),
  ],
  controllers: [ClaimRestController],
  providers: [
    // Bindings de Puertos a Implementaciones
    {
      provide: CLAIM_COMMAND_PORT,
      useClass: ClaimCommandService,
    },
    {
      provide: CLAIM_QUERY_PORT,
      useClass: ClaimQueryService,
    },
    {
      provide: CLAIM_PORT_OUT,
      useClass: ClaimTypeormRepository,
    },
  ],
  exports: [CLAIM_COMMAND_PORT, CLAIM_QUERY_PORT],
})
export class ClaimModule {}
