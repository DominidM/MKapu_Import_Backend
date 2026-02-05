/* logistics/src/logistics.controller.ts */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LogisticsService } from './logistics.service';

@Controller()
export class LogisticsController {
  private readonly logger = new Logger(LogisticsController.name);

  constructor(private readonly logisticsService: LogisticsService) {}

  @MessagePattern({ cmd: 'register_movement' })
  async registerMovement(@Payload() data: any) {
    this.logger.log('📥 Petición TCP recibida: register_movement');
    
    try {
      // Mantenemos el uso original llamando a tu servicio
      await this.logisticsService.registerMovement(data);
      
      this.logger.log('✅ Movimiento procesado exitosamente');
      
      // Siempre retornamos algo para que Sales no se quede colgado
      return { success: true }; 
      
    } catch (error) {
      this.logger.error(`❌ Error procesando movimiento: ${error.message}`);
      
      // Al retornar un objeto con error en lugar de "lanzar" la excepción cruda,
      // evitamos que NestJS cierre la conexión TCP abruptamente.
      return { 
        success: false, 
        error: error.message || 'Error interno en Logistics' 
      };
    }
  }
}