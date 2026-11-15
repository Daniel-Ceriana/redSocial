import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
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
import { SoloAdministradorGuard } from '../autenticacion/guards/solo-administrador.guard.js';
import { PaginacionDto } from '../common/paginacion.dto.js';
import { AltaUsuarioDto } from './dto/alta-usuario.dto.js';
import { DeshabilitarUsuarioDto } from './dto/deshabilitar-usuario.dto.js';
import { UsuariosService, aPerfilPublico, aRespuesta, aRespuestaAdmin } from './usuarios.service.js';

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
  async perfilPublico(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: { usuario: PayloadToken },
  ) {
    const esAdministrador = req.usuario.perfil === 'administrador';
    return aPerfilPublico(await this.usuariosService.buscarPublico(id, esAdministrador));
  }

  // ---------- Solo administradores (4.B1): el AuthGuard de la clase corre primero, después este ----------

  // ?offset=&limit= (4.B2)
  @Get()
  @UseGuards(SoloAdministradorGuard)
  listar(@Query() paginacion: PaginacionDto) {
    return this.usuariosService.listar(paginacion);
  }

  // multipart/form-data: los campos del registro + "perfil" (usuario | administrador) + "imagen" opcional (4.B3)
  @Post()
  @UseGuards(SoloAdministradorGuard)
  @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
  async alta(
    @Body() dto: AltaUsuarioDto,
    @UploadedFile(crearPipeImagen()) imagen: Express.Multer.File | undefined,
  ) {
    return aRespuestaAdmin(await this.usuariosService.alta(dto, imagen));
  }

  // Baja lógica: ?ocultarPublicaciones=true|false es obligatorio (4.B4, D10.6)
  @Delete(':id')
  @UseGuards(SoloAdministradorGuard)
  deshabilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() consulta: DeshabilitarUsuarioDto,
    @Req() req: { usuario: PayloadToken },
  ) {
    return this.usuariosService.deshabilitar(id, req.usuario.sub, consulta.ocultarPublicaciones);
  }

  // Alta lógica (4.B5)
  @Post(':id/rehabilitar')
  @HttpCode(200)
  @UseGuards(SoloAdministradorGuard)
  rehabilitar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usuariosService.rehabilitar(id);
  }
}
