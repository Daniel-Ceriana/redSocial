import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Model } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

export interface PayloadToken {
  sub: string;
  correo: string;
  perfil: 'usuario' | 'administrador';
  iat: number; // cuándo se emitió (segundos)
  exp: number; // cuándo vence (segundos)
}

// El código permite al front distinguir este 403 de otros (por ejemplo "solo el autor puede editar")
export const cuentaDeshabilitada = () =>
  new ForbiddenException({
    message: 'Tu cuenta está deshabilitada. Contactá a un administrador.',
    error: 'Forbidden',
    statusCode: 403,
    codigo: 'CUENTA_DESHABILITADA',
  });

// Guard propio: lee "Authorization: Bearer <token>", lo verifica y deja el payload en request.usuario.
// Además comprueba en la base que la cuenta siga existiendo y habilitada, para que una baja
// hecha por un administrador se note en la siguiente petición y no recién cuando venza el token.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Usuario.name) private readonly usuarios: Model<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { usuario?: PayloadToken }>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }
    let payload: PayloadToken;
    try {
      payload = await this.jwtService.verifyAsync<PayloadToken>(token);
    } catch {
      throw new UnauthorizedException('El token no es válido o venció');
    }

    const usuario = await this.usuarios.findById(payload.sub).select('activo').lean().exec();
    if (!usuario) {
      throw new UnauthorizedException('El usuario del token ya no existe');
    }
    if (!usuario.activo) {
      throw cuentaDeshabilitada();
    }

    request.usuario = payload;
    return true;
  }
}
