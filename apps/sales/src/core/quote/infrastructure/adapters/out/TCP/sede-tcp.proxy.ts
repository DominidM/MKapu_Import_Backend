import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ISedeProxy, SedeInfo } from '../../../../domain/ports/out/sede-proxy.port';

@Injectable()
export class SedeTcpProxy implements ISedeProxy {
  private readonly logger = new Logger(SedeTcpProxy.name);

  constructor(
    @Inject('SEDE_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getSedeById(id_sede: number): Promise<SedeInfo | null> {
    try {
      const response = await firstValueFrom(
        this.client
          .send<{ ok: boolean; data: SedeInfo | null }>('get_sede_by_id_full', { id_sede: String(id_sede) })
          .pipe(timeout(5000)),
      );
      return response?.data ?? null;
    } catch (error: any) {
      this.logger.warn(`⚠️ No se pudo obtener sede ${id_sede}: ${error?.message}`);
      return null;
    }
  }
}