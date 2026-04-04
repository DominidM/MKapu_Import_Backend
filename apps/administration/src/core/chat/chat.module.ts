import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatRepository }     from './infrastructure/adapters/out/repository/chat.repository';
import { ChatGateway }        from './infrastructure/adapters/in/gateway/chat.gateway';
import { ChatController }     from './infrastructure/adapters/in/controller/chat.controller';
import { ChatCommandService } from './application/service/command/chat-command.service';
import { ChatQueryService }   from './application/service/query/chat-query.service';
import { ConversacionParticipanteOrmEntity } from './infrastructure/entity/conversacion-participante.orm-entity';
import { ConversacionOrmEntity }             from './infrastructure/entity/conversacion.orm-entity';
import { MensajeOrmEntity }                  from './infrastructure/entity/mensaje.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversacionOrmEntity,
      ConversacionParticipanteOrmEntity,
      MensajeOrmEntity,
    ]),
  ],
  providers: [
    {
      provide:  'IChatRepositoryPort',
      useClass: ChatRepository,
    },
    ChatQueryService,
    ChatCommandService,
    ChatGateway,
  ],
  controllers: [ChatController],
})
export class ChatModule {}