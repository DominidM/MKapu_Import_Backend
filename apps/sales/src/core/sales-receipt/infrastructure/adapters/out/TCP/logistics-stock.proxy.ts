/* sales/src/core/sales-receipt/infrastructure/adapters/out/TCP/logistics-stock.proxy.ts */
import { Inject, Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable()
export class LogisticsStockProxy implements OnModuleInit {
  constructor(
    @Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('✅ Sales conectado exitosamente al bus TCP de Logística');
    } catch (err) {
      console.error('❌ Sales no pudo conectar al bus TCP de Logística:', err.message);
    }
  }

  async registerMovement(data: any): Promise<void> {
    const pattern = { cmd: 'register_movement' };
    
    try {
      const response = await lastValueFrom(
        this.client.send(pattern, data).pipe(
          timeout(5000)
        )
      );

      if (response && response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      const errorMsg = error.message || 'Stock insuficiente o error de conexión';
      console.error(`[LogisticsStockProxy] ❌ DETENIENDO FLUJO: ${errorMsg}`);
      throw new Error(errorMsg); // Este throw es el que DEBE matar el service
    }
  }

}