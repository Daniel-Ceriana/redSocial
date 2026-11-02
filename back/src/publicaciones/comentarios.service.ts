import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginacionDto, Pagina } from '../common/paginacion.dto.js';
import { Comentario, ComentarioDocument } from './entities/comentario.entity.js';
import { CAMPOS_AUTOR, PublicacionesService, aAutor } from './publicaciones.service.js';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private readonly modelo: Model<Comentario>,
    private readonly publicacionesService: PublicacionesService,
  ) {}

  // Comentarios de una publicación, los más recientes primero. 404 si la publicación no existe.
  async listar(publicacionId: string, { offset, limit }: PaginacionDto): Promise<Pagina<unknown>> {
    await this.publicacionesService.buscarActiva(publicacionId);
    const filtro = { publicacion: publicacionId, activo: true };

    const [comentarios, total] = await Promise.all([
      this.modelo
        .find(filtro)
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .populate('autor', CAMPOS_AUTOR)
        .exec(),
      this.modelo.countDocuments(filtro),
    ]);

    return {
      datos: comentarios.map((c) => ({
        id: c.id as string,
        publicacion: c.publicacion.toString(),
        autor: aAutor(c.autor),
        mensaje: c.mensaje,
        modificado: c.modificado,
        fecha: (c as ComentarioDocument & { createdAt: Date }).createdAt,
      })),
      total,
      offset,
      limit,
    };
  }
}
