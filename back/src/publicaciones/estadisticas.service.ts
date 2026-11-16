import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import {
  ConsultaEstadisticasDto,
  DIAS_MAXIMOS_LAPSO,
  EstadoEstadisticas,
} from './dto/consulta-estadisticas.dto.js';
import { Comentario } from './entities/comentario.entity.js';
import { Publicacion } from './entities/publicacion.entity.js';

const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires';
const MS_POR_DIA = 24 * 60 * 60 * 1000;
// Publicaciones que muestra el gráfico de barras (las que más comentarios tienen)
const TOP_PUBLICACIONES = 10;

interface Lapso {
  desde: Date; // 00:00 (hora argentina) del primer día, incluido
  hasta: Date; // 00:00 (hora argentina) del día siguiente al último, excluido
  dias: string[]; // todos los días del lapso, AAAA-MM-DD
}

// Estadísticas para los gráficos del dashboard (4.B6). Todas son agregaciones de MongoDB.
@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>,
    @InjectModel(Comentario.name) private comentarioModel: Model<Comentario>,
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
  ) {}

  // Torta: cuántas publicaciones creó cada usuario en el lapso
  async publicacionesPorUsuario(dto: ConsultaEstadisticasDto) {
    const lapso = this.lapso(dto);
    const filas = await this.publicacionModel.aggregate<{
      _id: string;
      cantidad: number;
      usuario: string;
    }>([
      {
        $match: {
          createdAt: { $gte: lapso.desde, $lt: lapso.hasta },
          ...this.filtroEstado(dto.estado),
        },
      },
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: this.usuarioModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'autor',
        },
      },
      {
        $project: {
          cantidad: 1,
          usuario: { $arrayElemAt: ['$autor.nombreUsuario', 0] },
        },
      },
      { $sort: { cantidad: -1, usuario: 1 } },
    ]);
    return filas.map((f) => ({
      usuarioId: f._id.toString(),
      usuario: f.usuario,
      cantidad: f.cantidad,
    }));
  }

  // Líneas: comentarios por día, con los días sin comentarios en 0 (D12.2)
  async comentariosPorDia(dto: ConsultaEstadisticasDto) {
    const lapso = this.lapso(dto);
    const filas = await this.comentarioModel.aggregate<{ _id: string; cantidad: number }>([
      ...this.comentariosDelLapso(lapso, dto.estado),
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ZONA_ARGENTINA } },
          cantidad: { $sum: 1 },
        },
      },
    ]);
    const porDia = new Map(filas.map((f) => [f._id, f.cantidad]));
    return lapso.dias.map((fecha) => ({ fecha, cantidad: porDia.get(fecha) ?? 0 }));
  }

  // Barras: las publicaciones con más comentarios en el lapso
  async comentariosPorPublicacion(dto: ConsultaEstadisticasDto) {
    const lapso = this.lapso(dto);
    const filas = await this.comentarioModel.aggregate<{
      _id: string;
      cantidad: number;
      titulo: string;
    }>([
      ...this.comentariosDelLapso(lapso, dto.estado),
      {
        $group: {
          _id: '$publicacion',
          cantidad: { $sum: 1 },
          titulo: { $first: { $arrayElemAt: ['$pub.titulo', 0] } },
        },
      },
      { $sort: { cantidad: -1, titulo: 1 } },
      { $limit: TOP_PUBLICACIONES },
    ]);
    return filas.map((f) => ({
      publicacionId: f._id.toString(),
      titulo: f.titulo,
      cantidad: f.cantidad,
    }));
  }

  // Comentarios hechos en el lapso, de publicaciones que cumplen el estado pedido (queda en "pub")
  private comentariosDelLapso(lapso: Lapso, estado: EstadoEstadisticas): PipelineStage[] {
    return [
      { $match: { createdAt: { $gte: lapso.desde, $lt: lapso.hasta }, activo: true } },
      {
        $lookup: {
          from: this.publicacionModel.collection.name,
          localField: 'publicacion',
          foreignField: '_id',
          as: 'pub',
        },
      },
      // "pub" es un arreglo de un elemento: el filtro se aplica a ese elemento
      ...(estado === 'todas'
        ? []
        : [{ $match: { 'pub.activa': estado === 'activas' } } as PipelineStage]),
    ];
  }

  private filtroEstado(estado: EstadoEstadisticas): { activa?: boolean } {
    if (estado === 'todas') return {};
    return { activa: estado === 'activas' };
  }

  // Valida el lapso (400) y lo pasa a fechas: los días son argentinos (UTC-3, sin horario de verano)
  private lapso(dto: ConsultaEstadisticasDto): Lapso {
    const desde = new Date(`${dto.desde}T00:00:00-03:00`);
    const ultimo = new Date(`${dto.hasta}T00:00:00-03:00`);
    if (desde > ultimo) {
      throw new BadRequestException('desde no puede ser posterior a hasta');
    }
    const cantidadDias = Math.round((ultimo.getTime() - desde.getTime()) / MS_POR_DIA) + 1;
    if (cantidadDias > DIAS_MAXIMOS_LAPSO) {
      throw new BadRequestException(`El lapso puede ser de hasta ${DIAS_MAXIMOS_LAPSO} días`);
    }
    // Los días se arman en UTC solo para contarlos y escribirlos; no importa la hora
    const base = Date.parse(`${dto.desde}T00:00:00Z`);
    const dias = Array.from({ length: cantidadDias }, (_, i) =>
      new Date(base + i * MS_POR_DIA).toISOString().slice(0, 10),
    );
    return { desde, hasta: new Date(ultimo.getTime() + MS_POR_DIA), dias };
  }
}
