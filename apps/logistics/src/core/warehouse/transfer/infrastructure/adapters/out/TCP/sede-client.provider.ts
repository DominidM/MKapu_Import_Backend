import { Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const SedeClientProvider: Provider = {
  provide: 'SEDE_SERVICE',
  useFactory: (configService: ConfigService) => {
    const host = configService.get<string>('SEDE_SERVICE_HOST', 'localhost');
    const port = configService.get<number>('SEDE_SERVICE_PORT', 3011);

    return ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    });
  },
  inject: [ConfigService],
};
