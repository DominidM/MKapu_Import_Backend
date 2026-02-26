import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { LogisticsModule } from './logistics.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(LogisticsModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3004,
    },
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Logistics Microservice')
    .setDescription('API de logística: envíos, stock, seguimiento, etc.')
    .setVersion('1.0')
    .addTag('logistics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.startAllMicroservices();
  await app.listen(3005);

  console.log(
    `📦 Logistics Microservice corriendo en HTTP: http://localhost:3005`
  );
  console.log(
    `📑 Logistics Swagger en: http://localhost:3005/api`
  );
}

bootstrap();