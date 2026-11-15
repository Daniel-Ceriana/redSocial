import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PayloadToken } from './auth.guard.js';

// Va después del AuthGuard (que ya dejó el payload en request.usuario): valida el perfil del token (4.B1).
// Uso: @UseGuards(AuthGuard, SoloAdministradorGuard)
@Injectable()
export class SoloAdministradorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { usuario?: PayloadToken }>();
    if (request.usuario?.perfil !== 'administrador') {
      throw new ForbiddenException('Solo un administrador puede hacer esto');
    }
    return true;
  }
}
