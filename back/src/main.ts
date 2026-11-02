import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

// Para que resuelva mongodb+srv:// con algunos proveedores de internet (igual que en clase)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // FRONT_URL puede traer varias URLs separadas por coma; se les saca la barra final
  // porque el navegador manda el origen sin ella y tienen que coincidir exactas
  const origenes = (process.env.FRONT_URL ?? 'http://localhost:4200')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''));
  app.enableCors({ origin: origenes });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Igual que el de Nest, pero con el aviso de "campo no permitido" en español
      exceptionFactory: (errores) =>
        new BadRequestException(
          errores.flatMap((e) =>
            Object.entries(e.constraints ?? {}).map(([tipo, mensaje]) =>
              tipo === 'whitelistValidation'
                ? `El campo "${e.property}" no está permitido`
                : mensaje,
            ),
          ),
        ),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
