import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SedeTcpProxy {
  private readonly logger = new Logger(SedeTcpProxy.name);

  constructor(
    @Inject('ADMIN_SERVICE') private readonly client: ClientProxy,
  ) {}

  async getSedeById(id_sede: number): Promise<{ nombre: string } | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('get_sede_by_id', { id_sede: String(id_sede) }),
      );
      if (response?.ok && response?.data) return response.data;
      return null;
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo obtener sede ${id_sede}: ${error?.message}`);
      return null;
    }
  }
}