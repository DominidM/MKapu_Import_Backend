// infrastructure/adapters/in/empresa.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Empresa } from '../../../../domain/entity/empresa.entity';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/empresa',
})
export class EmpresaGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('EmpresaGateway iniciado');
  }

  emitEmpresaUpdated(empresa: Empresa): void {
    this.server.emit('empresa:updated', {
      nombreComercial: empresa.nombreComercial,
      razonSocial:     empresa.razonSocial,
      ruc:             empresa.ruc,
      logoUrl:         empresa.logoUrl,
      updatedAt:       empresa.updatedAt,
    });
  }
}