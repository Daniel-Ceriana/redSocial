import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, PayloadToken } from '../autenticacion/guards/auth.guard.js';
import { UsuariosService, aRespuesta } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Datos del usuario logueado
  @Get('yo')
  async yo(@Req() req: { usuario: PayloadToken }) {
    return aRespuesta(await this.usuariosService.buscarPorId(req.usuario.sub));
  }
}
