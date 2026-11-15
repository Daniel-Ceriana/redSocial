import {
  BadRequestException,
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

// Estado de una publicación (S11): activa, o por qué se dio de baja. Las eliminadas antes de guardar
// "bajaPor" no se sabe quién las eliminó: quedan como "eliminada".
export type EstadoPublicacion =
  | 'activa'
  | 'eliminadaPorAutor'
  | 'bajaPorAdministrador'
  | 'ocultaPorDeshabilitacion'
  | 'eliminada';

function estadoDe(p: PublicacionDocument): EstadoPublicacion {
  if (p.activa) return 'activa';
  if (p.ocultaPorDeshabilitacion) return 'ocultaPorDeshabilitacion';
  if (p.bajaPor === 'autor') return 'eliminadaPorAutor';
  if (p.bajaPor === 'administrador') return 'bajaPorAdministrador';
  return 'eliminada';
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
    estado: estadoDe(publicacion),
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

  // Con incluirBajas (solo administradores, y solo junto con "usuario") trae también las dadas de baja,
  // cada una con su estado, para poder darlas de alta de nuevo (S11)
  async listar(consulta: ConsultaPublicacionesDto, solicitante: PayloadToken): Promise<Pagina<unknown>> {
    const { orden, usuario, offset, limit, incluirBajas } = consulta;
    const usuarioId = solicitante.sub;
    if (incluirBajas) {
      if (solicitante.perfil !== 'administrador') {
        throw new ForbiddenException('Solo un administrador puede ver las publicaciones dadas de baja');
      }
      if (!usuario) {
        throw new BadRequestException('incluirBajas se usa junto con usuario');
      }
    }
    const filtro: Record<string, unknown> = incluirBajas ? {} : { activa: true };
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

  // Una publicación (X17), con la misma forma que cada una del listado. 404 si no existe o está dada de baja.
  async obtener(id: string, usuarioId: string) {
    const publicacion = await (await this.buscarActiva(id)).populate('autor', CAMPOS_AUTOR);
    const cantidadComentarios = await this.modeloComentarios.countDocuments({
      publicacion: publicacion._id,
      activo: true,
    });
    return aRespuesta(publicacion, usuarioId, cantidadComentarios);
  }

  // Baja lógica: solo el autor o un administrador
  async eliminar(id: string, usuario: PayloadToken) {
    const publicacion = await this.buscarActiva(id);
    const esAutor = publicacion.autor.toString() === usuario.sub;
    if (!esAutor && usuario.perfil !== 'administrador') {
      throw new ForbiddenException('Solo el autor o un administrador puede eliminar la publicación');
    }
    publicacion.activa = false;
    publicacion.bajaPor = esAutor ? 'autor' : 'administrador';
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

  // Da de alta otra vez una publicación dada de baja (solo administradores; el guard lo controla).
  // Regla única (D11.10): mientras el autor esté deshabilitado no se da de alta ninguna publicación suya,
  // esté en el estado que esté; primero se lo rehabilita (las ocultas por la deshabilitación vuelven solas).
  async restaurar(id: string, usuarioId: string) {
    const publicacion = await this.modelo.findById(id).populate('autor', `${CAMPOS_AUTOR} activo`).exec();
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }
    if (publicacion.activa) {
      throw new ConflictException('La publicación ya está activa');
    }
    const autor = publicacion.autor as unknown as { activo: boolean; nombreUsuario: string };
    if (!autor.activo) {
      throw new ConflictException(
        `Rehabilitá primero a @${autor.nombreUsuario} para dar de alta sus publicaciones`,
      );
    }
    publicacion.activa = true;
    publicacion.bajaPor = null;
    publicacion.ocultaPorDeshabilitacion = false;
    await publicacion.save();
    const cantidadComentarios = await this.modeloComentarios.countDocuments({
      publicacion: publicacion._id,
      activo: true,
    });
    return aRespuesta(publicacion as PublicacionDocument, usuarioId, cantidadComentarios);
  }

  // Al deshabilitar a un usuario, si el administrador lo eligió: oculta sus publicaciones activas (D10.6)
  async ocultarDeAutor(autorId: string): Promise<number> {
    const { modifiedCount } = await this.modelo.updateMany(
      { autor: autorId, activa: true },
      { $set: { activa: false, ocultaPorDeshabilitacion: true } },
    );
    return modifiedCount;
  }

  // Al rehabilitarlo: vuelven solo las que se ocultaron por la deshabilitación (D10.7)
  async restaurarDeAutor(autorId: string): Promise<number> {
    const { modifiedCount } = await this.modelo.updateMany(
      { autor: autorId, ocultaPorDeshabilitacion: true },
      { $set: { activa: true, ocultaPorDeshabilitacion: false, bajaPor: null } },
    );
    return modifiedCount;
  }

  async buscarActiva(id: string) {
    const publicacion = await this.modelo.findOne({ _id: id, activa: true }).exec();
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }
    return publicacion;
  }
}
