import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ArchivosService } from '../common/archivos.service.js';
import { Pagina } from '../common/paginacion.dto.js';
import { PayloadToken } from '../autenticacion/guards/auth.guard.js';
import { ConsultaPublicacionesDto } from './dto/consulta-publicaciones.dto.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { Comentario } from './entities/comentario.entity.js';
import { Publicacion, PublicacionDocument } from './entities/publicacion.entity.js';

// Datos públicos del autor (nunca correo ni contraseña)
export const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';

export interface AutorResumen {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagenPerfil: string;
}

export function aAutor(autor: unknown): AutorResumen {
  const a = autor as AutorResumen & { _id: Types.ObjectId };
  return {
    id: a._id.toString(),
    nombre: a.nombre,
    apellido: a.apellido,
    nombreUsuario: a.nombreUsuario,
    imagenPerfil: a.imagenPerfil,
  };
}

function aRespuesta(
  publicacion: PublicacionDocument,
  usuarioId: string,
  cantidadComentarios: number,
) {
  return {
    id: publicacion.id as string,
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion,
    imagen: publicacion.imagen,
    fecha: (publicacion as unknown as { createdAt: Date }).createdAt,
    autor: aAutor(publicacion.autor),
    cantidadMeGusta: publicacion.cantidadMeGusta,
    yoMeGusta: publicacion.meGusta.some((id) => id.toString() === usuarioId),
    cantidadComentarios,
  };
}

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name) private readonly modelo: Model<Publicacion>,
    @InjectModel(Comentario.name) private readonly modeloComentarios: Model<Comentario>,
    private readonly archivosService: ArchivosService,
  ) {}

  async crear(dto: CrearPublicacionDto, imagen: Express.Multer.File | undefined, usuarioId: string) {
    const urlImagen = imagen ? await this.archivosService.subirImagen(imagen, 'publicaciones') : '';
    const creada = await this.modelo.create({
      titulo: dto.titulo,
      descripcion: dto.descripcion ?? '',
      imagen: urlImagen,
      autor: usuarioId,
    });
    const publicacion = await creada.populate('autor', CAMPOS_AUTOR);
    return aRespuesta(publicacion, usuarioId, 0);
  }

  async listar(consulta: ConsultaPublicacionesDto, usuarioId: string): Promise<Pagina<unknown>> {
    const { orden, usuario, offset, limit } = consulta;
    const filtro: Record<string, unknown> = { activa: true };
    if (usuario) filtro['autor'] = usuario;

    // Desempata por _id para que la paginación sea estable
    const criterio: Record<string, 1 | -1> =
      orden === 'meGusta'
        ? { cantidadMeGusta: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };

    const [publicaciones, total] = await Promise.all([
      this.modelo
        .find(filtro)
        .sort(criterio)
        .skip(offset)
        .limit(limit)
        .populate('autor', CAMPOS_AUTOR)
        .exec(),
      this.modelo.countDocuments(filtro),
    ]);

    // Cantidad de comentarios de las publicaciones de esta página, en una sola consulta
    const cantidades = await this.modeloComentarios.aggregate<{ _id: Types.ObjectId; total: number }>([
      { $match: { publicacion: { $in: publicaciones.map((p) => p._id) }, activo: true } },
      { $group: { _id: '$publicacion', total: { $sum: 1 } } },
    ]);
    const porPublicacion = new Map(cantidades.map((c) => [c._id.toString(), c.total]));

    return {
      datos: publicaciones.map((p) =>
        aRespuesta(p as PublicacionDocument, usuarioId, porPublicacion.get(p.id as string) ?? 0),
      ),
      total,
      offset,
      limit,
    };
  }

  // Baja lógica: solo el autor o un administrador
  async eliminar(id: string, usuario: PayloadToken) {
    const publicacion = await this.buscarActiva(id);
    const esAutor = publicacion.autor.toString() === usuario.sub;
    if (!esAutor && usuario.perfil !== 'administrador') {
      throw new ForbiddenException('Solo el autor o un administrador puede eliminar la publicación');
    }
    publicacion.activa = false;
    await publicacion.save();
  }

  // Un solo update atómico: solo agrega si el usuario todavía no estaba
  async darMeGusta(id: string, usuarioId: string) {
    const usuario = new Types.ObjectId(usuarioId);
    const actualizada = await this.modelo.findOneAndUpdate(
      { _id: id, activa: true, meGusta: { $ne: usuario } },
      { $addToSet: { meGusta: usuario }, $inc: { cantidadMeGusta: 1 } },
      { returnDocument: 'after' },
    );
    if (!actualizada) {
      await this.buscarActiva(id); // 404 si no existe
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return { cantidadMeGusta: actualizada.cantidadMeGusta, yoMeGusta: true };
  }

  // Solo se puede quitar si el usuario lo había dado
  async quitarMeGusta(id: string, usuarioId: string) {
    const usuario = new Types.ObjectId(usuarioId);
    const actualizada = await this.modelo.findOneAndUpdate(
      { _id: id, activa: true, meGusta: usuario },
      { $pull: { meGusta: usuario }, $inc: { cantidadMeGusta: -1 } },
      { returnDocument: 'after' },
    );
    if (!actualizada) {
      await this.buscarActiva(id); // 404 si no existe
      throw new ConflictException('Todavía no le diste me gusta a esta publicación');
    }
    return { cantidadMeGusta: actualizada.cantidadMeGusta, yoMeGusta: false };
  }

  async buscarActiva(id: string) {
    const publicacion = await this.modelo.findOne({ _id: id, activa: true }).exec();
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }
    return publicacion;
  }
}
