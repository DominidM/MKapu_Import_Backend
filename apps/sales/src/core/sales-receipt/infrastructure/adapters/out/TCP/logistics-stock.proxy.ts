/* sales/src/core/sales-receipt/infrastructure/adapters/out/TCP/logistics-stock.proxy.ts */
import { Inject, Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable()
export class LogisticsStockProxy implements OnModuleInit {
  constructor(
    @Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy,
  ) {}

  private static isConnecting = false;
  private static hasConnected = false;
  // Lógica de reconexión robusta para evitar ECONNREFUSED al iniciar todo junto
  async onModuleInit() {
    // 1. Evitamos que múltiples llamadas simultáneas inicien bucles de reintento
    if (LogisticsStockProxy.isConnecting || LogisticsStockProxy.hasConnected) {
      return;
    }

    LogisticsStockProxy.isConnecting = true;
    const MAX_RETRIES = 10;
    let delay = 2000; 

    for (let i = 1; i <= MAX_RETRIES; i++) {
      try {
        // Intentamos la conexión TCP
        await this.client.connect();
        
        // 2. Solo imprimimos el éxito una vez
        if (!LogisticsStockProxy.hasConnected) {
          console.log('✅ [LogisticsStockProxy] Conectado exitosamente al bus TCP (Puerto 3005)');
          LogisticsStockProxy.hasConnected = true;
        }
        
        LogisticsStockProxy.isConnecting = false;
        return; 

      } catch (err) {
        // 3. Log de error silencioso para no ensuciar la consola si ya sabemos que está reintentando
        console.error(`❌ [LogisticsStockProxy] Intento ${i}/${MAX_RETRIES} fallido: Logistics no responde. Reintentando en ${delay / 1000}s...`);
        
        if (i === MAX_RETRIES) {
          console.error('🛑 [LogisticsStockProxy] No se pudo establecer conexión tras varios intentos.');
          LogisticsStockProxy.isConnecting = false;
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
          // Backoff progresivo: 2s, 3s, 4.5s... hasta un tope de 10s
          delay = Math.min(delay * 1.5, 10000); 
        }
      }
    }
  }

  async registerMovement(data: any): Promise<void> {
    try {
      const pattern = { cmd: 'register_movement' };
      
      // Enviamos y esperamos respuesta. Si el microservicio devuelve un error, 
      // lastValueFrom lanzará una excepción automáticamente.
      await lastValueFrom(
        this.client.send(pattern, data).pipe(timeout(5000))
      );
      
    } catch (error) {
      // Limpiamos el mensaje para que el usuario no vea "Error: Error: ..."
      const rawMsg = error.message || 'Error de comunicación con Logística';
      const cleanMsg = rawMsg.replace(/Error:/g, '').trim();
      
      console.error(`[LogisticsStockProxy] ❌ Error en movimiento: ${cleanMsg}`);
      
      // Lanzamos un error genérico que el Service capturará para hacer el Rollback
      throw new Error(cleanMsg);
    }
  }
}