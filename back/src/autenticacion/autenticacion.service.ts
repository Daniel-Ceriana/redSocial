import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ArchivosService } from '../common/archivos.service.js';
import { UsuarioDocument } from '../usuarios/entities/usuario.entity.js';
import { UsuariosService, aRespuesta } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly archivosService: ArchivosService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registro(dto: RegistroDto, imagen?: Express.Multer.File) {
    await this.usuariosService.verificarDisponibles(dto.correo, dto.nombreUsuario);
    const imagenPerfil = imagen
      ? await this.archivosService.subirImagen(imagen, 'perfiles')
      : this.config.get<string>('IMAGEN_PERFIL_DEFECTO', '');
    const usuario = await this.usuariosService.crear({ ...dto, imagenPerfil });
    return this.emitirSesion(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarParaLogin(dto.correo);
    // Mismo mensaje si el correo no existe o la contraseña es incorrecta
    const valida = await this.usuariosService.verificarContrasena(
      dto.contrasena,
      usuario?.contrasena,
    );
    if (!usuario || !valida) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    return this.emitirSesion(usuario);
  }

  // Token nuevo con el mismo payload y la duración completa (30 s), contada desde ahora.
  // El AuthGuard ya rechazó con 401 un token vencido o inválido; si el usuario ya no existe, también 401.
  async refrescar(usuarioId: string) {
    try {
      return await this.emitirSesion(await this.usuariosService.buscarPorId(usuarioId));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('El usuario del token ya no existe');
      }
      throw error;
    }
  }

  // emitidoEn y venceEn salen del propio token (iat y exp): con eso el front calcula la mitad de su vida
  private async emitirSesion(usuario: UsuarioDocument) {
    const token = await this.jwtService.signAsync({
      sub: usuario.id as string,
      correo: usuario.correo,
      perfil: usuario.perfil,
    });
    const { iat, exp } = this.jwtService.decode<{ iat: number; exp: number }>(token);
    return {
      token,
      emitidoEn: new Date(iat * 1000).toISOString(),
      venceEn: new Date(exp * 1000).toISOString(),
      usuario: aRespuesta(usuario),
    };
  }
}
