import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AdministrationModule } from './administration.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AdministrationModule);

  const tcpPort = 3011;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = configService.get<number>('ADMINISTRATION_PORT') || 3002;

  await app.listen(port);

  console.log(`🏢 Administration HTTP: http://localhost:${port}`);
  console.log(`🏢 Administration TCP interno: ${tcpPort}`);
}

bootstrap();