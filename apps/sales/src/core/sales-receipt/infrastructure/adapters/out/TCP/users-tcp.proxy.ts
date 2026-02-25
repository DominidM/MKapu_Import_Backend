// infrastructure/adapters/out/TCP/users-tcp.proxy.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersTcpProxy {
  private readonly logger = new Logger(UsersTcpProxy.name);
  private readonly internalSecret: string;

  constructor(
    @Inject('USERS_SERVICE') private readonly client: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    // ✅ nombre exacto de tu .env
    this.internalSecret = this.configService.get<string>(
      'INTERNAL_COMM_SECRET',
      'mkapu_internal_tcp_secret_2025_$ecur3',
    );
  }

  async findByIds(ids: number[]): Promise<Array<{
    id_usuario: number;
    nombreCompleto: string;
  }>> {
    try {
      this.logger.debug(`📡 Enviando users.findByIds con ${ids.length} ID(s): ${ids}`);

      const response = await firstValueFrom(
        this.client.send('users.findByIds', {
          ids,
          secret: this.internalSecret,  // ✅ Guard lo valida con esta key
        }),
      );

      if (response?.ok && response?.data) return response.data;

      this.logger.warn(`⚠️ TCP respondió ok=false: ${response?.message}`);
      return [];
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo obtener usuarios: ${error?.message}`);
      return [];
    }
  }
}
