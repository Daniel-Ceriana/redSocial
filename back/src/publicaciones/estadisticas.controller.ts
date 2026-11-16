import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../autenticacion/guards/auth.guard.js';
import { SoloAdministradorGuard } from '../autenticacion/guards/solo-administrador.guard.js';
import {
  ConsultaComentariosPublicacionDto,
  ConsultaEstadisticasDto,
  ConsultaRankingDto,
} from './dto/consulta-estadisticas.dto.js';
import { EstadisticasService } from './estadisticas.service.js';

// Datos de los gráficos de dashboard/estadisticas (4.B6): solo administradores
@Controller('estadisticas')
@UseGuards(AuthGuard, SoloAdministradorGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() consulta: ConsultaRankingDto) {
    return this.estadisticasService.publicacionesPorUsuario(consulta);
  }

  @Get('comentarios-por-dia')
  comentariosPorDia(@Query() consulta: ConsultaEstadisticasDto) {
    return this.estadisticasService.comentariosPorDia(consulta);
  }

  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() consulta: ConsultaComentariosPublicacionDto) {
    return this.estadisticasService.comentariosPorPublicacion(consulta);
  }
}
