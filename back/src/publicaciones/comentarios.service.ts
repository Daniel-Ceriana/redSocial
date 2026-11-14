import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginacionDto, Pagina } from '../common/paginacion.dto.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { Comentario, ComentarioDocument } from './entities/comentario.entity.js';
import { CAMPOS_AUTOR, PublicacionesService, aAutor } from './publicaciones.service.js';

// Lo que se devuelve de un comentario (con el autor ya cargado con populate)
function aRespuesta(comentario: ComentarioDocument) {
  return {
    id: comentario.id as string,
    publicacion: comentario.publicacion.toString(),
    autor: aAutor(comentario.autor),
    mensaje: comentario.mensaje,
    modificado: comentario.modificado,
    fecha: (comentario as ComentarioDocument & { createdAt: Date }).createdAt,
  };
}

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private readonly modelo: Model<Comentario>,
    private readonly publicacionesService: PublicacionesService,
  ) {}

  // Comentarios de una publicación, los más recientes primero. 404 si la publicación no existe.
  // Si entra un comentario nuevo entre una carga y otra, "cargar más" puede traer uno repetido
  // (la lista se corre un lugar): el front lo descarta por id (D7.3).
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

    return { datos: comentarios.map(aRespuesta), total, offset, limit };
  }

  // 404 si la publicación no existe o está dada de baja (D7.8)
  async crear(publicacionId: string, dto: ComentarioDto, usuarioId: string) {
    await this.publicacionesService.buscarActiva(publicacionId);
    const creado = await this.modelo.create({
      publicacion: publicacionId,
      autor: usuarioId,
      mensaje: dto.mensaje,
    });
    return aRespuesta(await creado.populate('autor', CAMPOS_AUTOR));
  }

  // Solo el autor, aunque sea administrador (D7.1). Si el mensaje no cambió, no se marca (D7.6).
  async editar(publicacionId: string, comentarioId: string, dto: ComentarioDto, usuarioId: string) {
    await this.publicacionesService.buscarActiva(publicacionId);
    const comentario = await this.modelo
      .findOne({ _id: comentarioId, publicacion: publicacionId, activo: true })
      .exec();
    if (!comentario) {
      throw new NotFoundException('El comentario no existe');
    }
    if (comentario.autor.toString() !== usuarioId) {
      throw new ForbiddenException('Solo el autor puede editar el comentario');
    }
    if (comentario.mensaje !== dto.mensaje) {
      comentario.mensaje = dto.mensaje;
      comentario.modificado = true;
      await comentario.save();
    }
    return aRespuesta(await comentario.populate('autor', CAMPOS_AUTOR));
  }
}
