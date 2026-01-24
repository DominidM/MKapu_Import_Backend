//headquarters/headquarters.module.ts
/* ============================================
   administration/src/core/headquarters/headquarters.module.ts
   ============================================ */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HeadquartersOrmEntity } from "./infrastructure/entity/headquarters-orm.entity";
import { HeadquarterRestController } from "./infrastructure/adapters/in/controllers/headquarters-rest.controller";
import { HeadquarterWebSocketGateway } from "./infrastructure/adapters/out/headquarters-websocket.gateway";
import { HeadquarterRepository } from "./infrastructure/adapters/out/repository/headquarters.repository";
import { HeadquartersCommandService } from "./application/service/headquarters-command.service";
import { HeadquartersQueryService } from "./application/service/headquarters-query.service";

@Module({
   imports: [TypeOrmModule.forFeature([HeadquartersOrmEntity])],
   controllers: [HeadquarterRestController],
   providers: [
      HeadquarterWebSocketGateway,
      {
         provide: 'IHeadquartersRepositoryPort',
         useClass: HeadquarterRepository
      },
      {
         provide: 'IHeadquartersCommandPort',
         useClass: HeadquartersCommandService
      },
      {
         provide: 'IHeadquartersQueryPort',
         useClass: HeadquartersQueryService
      }
   ],
   exports: ['IHeadquartersCommandPort', 'IHeadquartersQueryPort', HeadquarterWebSocketGateway],
})
export class HeadquartersModule {}