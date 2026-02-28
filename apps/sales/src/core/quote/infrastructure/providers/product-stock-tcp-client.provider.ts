import { Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const ProductStockTcpClientProvider: Provider = {
  provide: 'PRODUCT_STOCK_SERVICE',
  useFactory: (configService: ConfigService) => {
    const host = configService.get<string>('PRODUCT_STOCK_TCP_HOST', 'localhost');
    const port = configService.get<number>('PRODUCT_STOCK_TCP_PORT', 5005);
    console.log(`🔌 Configurando cliente TCP para PRODUCT_STOCK_SERVICE en ${host}:${port}`);
    return ClientProxyFactory.create({ transport: Transport.TCP, options: { host, port } });
  },
  inject: [ConfigService],
};