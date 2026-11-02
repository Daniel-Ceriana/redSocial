import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
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
import { ConsultaPublicacionesDto } from './dto/consulta-publicaciones.dto.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

type Solicitud = { usuario: PayloadToken };

@Controller('publicaciones')
@UseGuards(AuthGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  // multipart/form-data: titulo, descripcion (opcional) e imagen (opcional)
  @Post()
  @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
  crear(
    @Body() dto: CrearPublicacionDto,
    @UploadedFile(crearPipeImagen()) imagen: Express.Multer.File | undefined,
    @Req() req: Solicitud,
  ) {
    return this.publicacionesService.crear(dto, imagen, req.usuario.sub);
  }

  @Get()
  listar(@Query() consulta: ConsultaPublicacionesDto, @Req() req: Solicitud) {
    return this.publicacionesService.listar(consulta, req.usuario.sub);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id', ParseObjectIdPipe) id: string, @Req() req: Solicitud) {
    return this.publicacionesService.eliminar(id, req.usuario);
  }

  @Post(':id/me-gusta')
  darMeGusta(@Param('id', ParseObjectIdPipe) id: string, @Req() req: Solicitud) {
    return this.publicacionesService.darMeGusta(id, req.usuario.sub);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(@Param('id', ParseObjectIdPipe) id: string, @Req() req: Solicitud) {
    return this.publicacionesService.quitarMeGusta(id, req.usuario.sub);
  }
}
