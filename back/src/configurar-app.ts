import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

// Toda la configuración de la app que no es "levantar el servidor". La usan main.ts y los tests e2e,
// así los tests prueban la misma app que corre en producción.
export function configurarApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  // Detrás del proxy de Vercel: sin esto todos los clientes parecen tener la misma IP y el límite de intentos sería global
  app.set('trust proxy', 1);
  // Cabeceras de seguridad HTTP (X-Content-Type-Options, HSTS, etc.)
  app.use(helmet());
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
}
