import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Type } from '@nestjs/common';
import type { Request } from 'express';

// Límite de pedidos por IP y por ruta, en memoria. Se usa en el login y en el registro para frenar la fuerza bruta.
// Es un guard propio y no `@nestjs/throttler`: esa librería está escrita en CommonJS, y con Nest 12 (solo ESM) la
// función de Vercel se caía al arrancar (ERR_REQUIRE_ESM).
//
// Limitación conocida: el contador vive en la memoria de cada instancia serverless, así que no es un límite global
// exacto. Para eso haría falta un almacén compartido (por ejemplo Redis).
//
// Uso: @UseGuards(limitarIntentos(5, 60_000))  -> 5 pedidos por minuto y por IP; el 6.º recibe 429
export function limitarIntentos(maximo: number, ventanaMs: number): Type<CanActivate> {
  @Injectable()
  class LimiteIntentosGuard implements CanActivate {
    // clave (IP + ruta) -> cuántos pedidos hizo y cuándo se reinicia su cuenta
    private readonly contadores = new Map<string, { cantidad: number; reiniciaEn: number }>();

    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
      const ahora = Date.now();
      this.limpiarVencidos(ahora);

      const clave = `${request.ip ?? 'desconocida'}|${request.method} ${request.path}`;
      const actual = this.contadores.get(clave);
      if (!actual || actual.reiniciaEn <= ahora) {
        this.contadores.set(clave, { cantidad: 1, reiniciaEn: ahora + ventanaMs });
        return true;
      }
      actual.cantidad++;
      if (actual.cantidad > maximo) {
        throw new HttpException(
          'Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return true;
    }

    // Para que el mapa no crezca sin límite en una instancia que vive mucho tiempo
    private limpiarVencidos(ahora: number) {
      if (this.contadores.size < 1000) return;
      for (const [clave, { reiniciaEn }] of this.contadores) {
        if (reiniciaEn <= ahora) this.contadores.delete(clave);
      }
    }
  }
  return LimiteIntentosGuard;
}
