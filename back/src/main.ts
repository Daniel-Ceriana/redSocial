import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';

// Para que resuelva mongodb+srv:// con algunos proveedores de internet (igual que en clase)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
