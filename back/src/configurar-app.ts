import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { RequestHandler } from 'express';
import * as helmetModulo from 'helmet';

// helmet publica tipos CommonJS (.d.cts) y, según cómo compile cada herramienta (el build de Vercel no lo resuelve
// igual que `nest build` en local), la función puede venir como el módulo, como `.default` o como `.default.default`.
// En ejecución siempre termina siendo una función, así que se la busca por ahí y no se depende de los tipos.
function cargarHelmet(): () => RequestHandler {
  let candidato: unknown = helmetModulo;
  for (let i = 0; i < 3 && typeof candidato !== 'function'; i++) {
    candidato = (candidato as { default?: unknown }).default;
  }
  if (typeof candidato !== 'function') throw new Error('No se pudo cargar helmet');
  return candidato as () => RequestHandler;
}

// Toda la configuración de la app que no es "levantar el servidor". La usan main.ts y los tests e2e,
// así los tests prueban la misma app que corre en producción.
export function configurarApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  // Detrás del proxy de Vercel: sin esto todos los clientes parecen tener la misma IP y el límite de intentos sería global
  app.set('trust proxy', 1);
  // Cabeceras de seguridad HTTP (X-Content-Type-Options, HSTS, etc.)
  app.use(cargarHelmet()());
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
