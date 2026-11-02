import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordHasher } from '@nestjs/authentication';
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

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly modelo: Model<Usuario>,
    private readonly hasher: PasswordHasher,
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
