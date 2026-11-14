import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, PayloadToken } from '../autenticacion/guards/auth.guard.js';
import { PaginacionDto } from '../common/paginacion.dto.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';

type Solicitud = { usuario: PayloadToken };

@Controller('publicaciones/:id/comentarios')
@UseGuards(AuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Get()
  listar(@Param('id', ParseObjectIdPipe) id: string, @Query() paginacion: PaginacionDto) {
    return this.comentariosService.listar(id, paginacion);
  }

  // { "mensaje": "..." }
  @Post()
  crear(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ComentarioDto,
    @Req() req: Solicitud,
  ) {
    return this.comentariosService.crear(id, dto, req.usuario.sub);
  }

  // { "mensaje": "..." } — solo el autor
  @Put(':comentarioId')
  editar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('comentarioId', ParseObjectIdPipe) comentarioId: string,
    @Body() dto: ComentarioDto,
    @Req() req: Solicitud,
  ) {
    return this.comentariosService.editar(id, comentarioId, dto, req.usuario.sub);
  }
}
