/* apps/auth/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module'; // Asegúrate de que la ruta sea correcta
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // 1. Crear la aplicación híbrida (HTTP + Microservicio opcional)
  const app = await NestFactory.create(AuthModule);

  // Opcional: Si Auth también escucha por TCP (ej. para validar tokens desde otros ms)
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.TCP,
  //   options: {
  //     host: '0.0.0.0',
  //     port: 3001, // Puerto TCP interno
  //   },
  // });

  // 2. Configuración Global de Pipes (Validaciones)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 3. Habilitar CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // 4. Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Auth Microservice API')
    .setDescription('Documentación de la API de Autenticación')
    .setVersion('1.0')
    .addTag('Auth')
    .addBearerAuth() // Si usas JWT, esto añade el botón de "Authorize"
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // La documentación estará disponible en /api/docs
  SwaggerModule.setup('api/docs', app, document);

  // 5. Iniciar Microservicios (si los hay)
  await app.startAllMicroservices();

  // 6. Levantar servidor HTTP
  // Asegúrate de usar un puerto libre (Logistics usa 3005, Sales suele usar 3000 o 3002)
  const port = process.env.AUTH_PORT ?? 3001;
  await app.listen(port);

  console.log(`🔐 Auth Service corriendo en HTTP: http://localhost:${port}`);
  console.log(`📄 Swagger disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
