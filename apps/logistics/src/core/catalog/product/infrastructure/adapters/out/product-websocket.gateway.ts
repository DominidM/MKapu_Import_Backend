import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { ProductResponseDto } from '../../../application/dto/out';

@WebSocketGateway({ cors: true })
@Injectable()
export class ProductWebSocketGateway {
  @WebSocketServer()
  server: Server;

  productCreated(product: ProductResponseDto) {
    this.server.emit('product.created', product);
  }

  productUpdated(product: ProductResponseDto) {
    this.server.emit('product.updated', product);
  }

  productDeleted(id: number) {
    this.server.emit('product.deleted', { id });
  }
}
