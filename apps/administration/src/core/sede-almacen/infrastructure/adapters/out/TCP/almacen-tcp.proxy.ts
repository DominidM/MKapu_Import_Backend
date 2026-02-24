import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  IWarehouseGatewayPort,
  WarehouseInfo,
} from '../../../../domain/ports/out/sede-almacen-ports-out';

type FindWarehousesByIdsReply =
  | { ok: true; data: WarehouseInfo[] }
  | { ok: false; message?: string; data?: null };

@Injectable()
export class AlmacenTcpProxy
  implements IWarehouseGatewayPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AlmacenTcpProxy.name);

  constructor(
    @Inject('ALMACEN_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error: any) {
      this.logger.warn(
        `No se pudo conectar a ALMACEN_SERVICE: ${error?.message ?? error}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
    } catch {
      // noop
    }
  }

  async getWarehouseById(id_almacen: number): Promise<WarehouseInfo | null> {
    if (!id_almacen || Number.isNaN(id_almacen)) return null;
    const list = await this.getWarehousesByIds([id_almacen]);
    return list.length > 0 ? list[0] : null;
  }

  async getWarehousesByIds(ids: number[]): Promise<WarehouseInfo[]> {
    const normalized = Array.from(
      new Set(ids.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (normalized.length === 0) return [];

    if (normalized.length > 100) {
      this.logger.warn(
        `Solicitud de almacenes excede limite (100). Recibidos: ${normalized.length}`,
      );
      return [];
    }

    try {
      const payload = {
        ids: normalized,
        secret: process.env.INTERNAL_COMM_SECRET,
      };
      const response = await firstValueFrom(
        this.client
          .send<FindWarehousesByIdsReply>('almacenes.findByIds', payload)
          .pipe(timeout(5000)),
      );

      if (!response || (response as any).ok === false) {
        return [];
      }

      return (response as any).data ?? [];
    } catch (error: any) {
      this.logger.warn(
        `Error consultando almacenes por TCP: ${error?.message ?? error}`,
      );
      return [];
    }
  }
}
