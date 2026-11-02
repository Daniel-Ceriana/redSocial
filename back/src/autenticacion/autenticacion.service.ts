import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  private async emitirSesion(usuario: UsuarioDocument) {
    const token = await this.jwtService.signAsync({
      sub: usuario.id as string,
      correo: usuario.correo,
      perfil: usuario.perfil,
    });
    const { exp } = this.jwtService.decode<{ exp: number }>(token);
    return {
      token,
      venceEn: new Date(exp * 1000).toISOString(),
      usuario: aRespuesta(usuario),
    };
  }
}
