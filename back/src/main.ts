import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';

// Para que resuelva mongodb+srv:// con algunos proveedores de internet (igual que en clase)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app as NestExpressApplication);
  await app.listen(process.env.PORT ?? 3000);
}
// Vercel detecta la app por esta forma exacta (create + bootstrap()), por eso no se usa `void` ni un genérico
// oxlint-disable-next-line typescript/no-floating-promises
bootstrap();
