/* logistics/src/core/inventory/infrastructure/adapters/in/controllers/inventory-message.controller.ts */

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class InventoryMessageController {
  
  @MessagePattern({ cmd: 'register_movement' })
  async handleRegisterMovement(@Payload() data: any) {
    console.log('📥 ¡Mensaje TCP recibido en Logística!', data);
    
    // Aquí iría tu lógica de negocio, por ahora retornamos éxito para probar la conexión
    return { 
      success: true, 
      message: 'Movimiento recibido en Logística' 
    };
  }
}