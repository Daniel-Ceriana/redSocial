import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard, PayloadToken } from '../autenticacion/guards/auth.guard.js';
import { crearPipeImagen } from '../common/imagen.pipe.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto.js';
import { UsuariosService, aPerfilPublico, aRespuesta } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Datos del usuario logueado
  @Get('yo')
  async yo(@Req() req: { usuario: PayloadToken }) {
    return aRespuesta(await this.usuariosService.buscarPorId(req.usuario.sub));
  }

  // Edita al usuario logueado (nunca a otro). multipart/form-data: campos opcionales + "imagen".
  @Patch('yo')
  @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
  async actualizarYo(
    @Body() dto: ActualizarUsuarioDto,
    @UploadedFile(crearPipeImagen()) imagen: Express.Multer.File | undefined,
    @Req() req: { usuario: PayloadToken },
  ) {
    return aRespuesta(await this.usuariosService.actualizar(req.usuario.sub, dto, imagen));
  }

  // Perfil público de otro usuario (sin correo ni fecha de nacimiento).
  // Va después de "yo" para que "yo" no se tome como un id.
  @Get(':id')
  async perfilPublico(@Param('id', ParseObjectIdPipe) id: string) {
    return aPerfilPublico(await this.usuariosService.buscarPublico(id));
  }
}
