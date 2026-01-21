/* ============================================
   administration/src/core/role/role.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { RoleOrmEntity } from './infrastructure/entity/role-orm.entity';
import { RoleRepository } from './infrastructure/repository/role.repository';
import { RoleRestController } from './infrastructure/controllers/role-rest.controller';
import { RoleWebSocketGateway } from './infrastructure/adapters/role-websocket.gateway';

// Application
import { RoleCommandService } from './application/service/role-command.service';
import { RoleQueryService } from './application/service/role-query.service';

@Module({
  imports: [
    // Registrar la entidad ORM
    TypeOrmModule.forFeature([RoleOrmEntity]),
  ],
  controllers: [
    // REST Controller para POST, PUT, DELETE
    RoleRestController,
  ],
  providers: [
    // WebSocket Gateway para GET
    RoleWebSocketGateway,

    // Repository - Implementación del puerto OUT
    {
      provide: 'IRoleRepositoryPort',
      useClass: RoleRepository,
    },

    // Command Service - Implementación del puerto IN (Comandos)
    {
      provide: 'IRoleCommandPort',
      useClass: RoleCommandService,
    },

    // Query Service - Implementación del puerto IN (Consultas)
    {
      provide: 'IRoleQueryPort',
      useClass: RoleQueryService,
    },
  ],
  exports: [
    // Exportar servicios para que otros módulos puedan usarlos
    'IRoleCommandPort',
    'IRoleQueryPort',
    RoleWebSocketGateway,
  ],
})
export class RoleModule {}