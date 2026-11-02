import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordHasher } from '@nestjs/authentication';
import { ArchivosService } from '../common/archivos.service.js';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto.js';
import { Perfil, Usuario, UsuarioDocument } from './entities/usuario.entity.js';

export interface DatosNuevoUsuario {
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  contrasena: string;
  fechaNacimiento: string;
  descripcion?: string;
  imagenPerfil: string;
}

// Lo único que sale hacia afuera: nunca incluye la contraseña
export function aRespuesta(usuario: UsuarioDocument) {
  return {
    id: usuario.id as string,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    correo: usuario.correo,
    nombreUsuario: usuario.nombreUsuario,
    fechaNacimiento: usuario.fechaNacimiento.toISOString().slice(0, 10),
    descripcion: usuario.descripcion,
    imagenPerfil: usuario.imagenPerfil,
    perfil: usuario.perfil,
  };
}

// Lo que puede ver cualquier usuario logueado de otro: sin correo ni fecha de nacimiento
export function aPerfilPublico(usuario: UsuarioDocument) {
  return {
    id: usuario.id as string,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    nombreUsuario: usuario.nombreUsuario,
    descripcion: usuario.descripcion,
    imagenPerfil: usuario.imagenPerfil,
  };
}

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly modelo: Model<Usuario>,
    private readonly hasher: PasswordHasher,
    private readonly archivosService: ArchivosService,
    private readonly config: ConfigService,
  ) {}

  // Verifica correo y nombre de usuario repetidos (409). Se llama antes de subir la imagen.
  async verificarDisponibles(correo: string, nombreUsuario: string) {
    if (await this.modelo.exists({ correo: correo.toLowerCase() })) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
    if (await this.modelo.exists({ nombreUsuario })) {
      throw new ConflictException('Ya existe un usuario con ese nombre de usuario');
    }
  }

  async crear(datos: DatosNuevoUsuario, perfil: Perfil = 'usuario') {
    try {
      const creado = await this.modelo.create({
        ...datos,
        fechaNacimiento: new Date(`${datos.fechaNacimiento}T00:00:00.000Z`),
        contrasena: await this.hasher.hash(datos.contrasena),
        perfil,
      });
      return creado as UsuarioDocument;
    } catch (error) {
      // Dos registros simultáneos pueden pasar la verificación: lo frena el índice único
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('El correo o el nombre de usuario ya están en uso');
      }
      throw error;
    }
  }

  // Trae la contraseña (hash) porque en el esquema está oculta; solo para el login
  buscarParaLogin(correo: string) {
    return this.modelo
      .findOne({ correo: correo.toLowerCase() })
      .select('+contrasena')
      .exec() as Promise<UsuarioDocument | null>;
  }

  // Edita los datos del propio usuario. El correo, el perfil (rol) y "activo" no se pueden cambiar.
  async actualizar(id: string, dto: ActualizarUsuarioDto, imagen?: Express.Multer.File) {
    const { quitarImagen, contrasena, fechaNacimiento, ...resto } = dto;
    const cambios: Record<string, unknown> = {};
    for (const [campo, valor] of Object.entries(resto)) {
      if (valor !== undefined) cambios[campo] = valor;
    }
    if (fechaNacimiento !== undefined) {
      cambios['fechaNacimiento'] = new Date(`${fechaNacimiento}T00:00:00.000Z`);
    }

    if (!imagen && quitarImagen !== true && contrasena === undefined && Object.keys(cambios).length === 0) {
      throw new BadRequestException('No hay nada para modificar');
    }

    const actual = await this.buscarPorId(id); // 404 si ya no existe
    const nombreUsuario = cambios['nombreUsuario'] as string | undefined;
    if (nombreUsuario && nombreUsuario !== actual.nombreUsuario) {
      if (await this.modelo.exists({ nombreUsuario, _id: { $ne: id } })) {
        throw new ConflictException('Ya existe un usuario con ese nombre de usuario');
      }
    }

    if (contrasena !== undefined) cambios['contrasena'] = await this.hasher.hash(contrasena);
    if (imagen) {
      cambios['imagenPerfil'] = await this.archivosService.subirImagen(imagen, 'perfiles');
    } else if (quitarImagen === true) {
      cambios['imagenPerfil'] = this.config.get<string>('IMAGEN_PERFIL_DEFECTO', '');
    }

    try {
      const actualizado = (await this.modelo
        .findByIdAndUpdate(id, { $set: cambios }, { returnDocument: 'after', runValidators: true })
        .exec()) as UsuarioDocument | null;
      if (!actualizado) throw new NotFoundException('El usuario no existe');
      return actualizado;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Ya existe un usuario con ese nombre de usuario');
      }
      throw error;
    }
  }

  // Para el perfil público: un usuario deshabilitado se trata como inexistente
  async buscarPublico(id: string) {
    const usuario = await this.buscarPorId(id);
    if (!usuario.activo) {
      throw new NotFoundException('El usuario no existe');
    }
    return usuario;
  }

  async buscarPorId(id: string) {
    const usuario = (await this.modelo.findById(id).exec()) as UsuarioDocument | null;
    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }
    return usuario;
  }

  verificarContrasena(contrasena: string, hash: string | undefined) {
    return this.hasher.verify(contrasena, hash);
  }
}
