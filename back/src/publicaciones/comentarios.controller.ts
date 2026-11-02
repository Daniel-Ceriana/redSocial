import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../autenticacion/guards/auth.guard.js';
import { PaginacionDto } from '../common/paginacion.dto.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { ComentariosService } from './comentarios.service.js';

@Controller('publicaciones/:id/comentarios')
@UseGuards(AuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Get()
  listar(@Param('id', ParseObjectIdPipe) id: string, @Query() paginacion: PaginacionDto) {
    return this.comentariosService.listar(id, paginacion);
  }
}
