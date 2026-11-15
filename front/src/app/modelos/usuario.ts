export type Perfil = 'usuario' | 'administrador';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string; // AAAA-MM-DD
  descripcion: string;
  imagenPerfil: string;
  perfil: Perfil;
}

// Lo que ve un administrador en el dashboard: además, el estado y la fecha de alta
export interface UsuarioAdmin extends Usuario {
  activo: boolean;
  creadoEn: string; // fecha ISO
}

// Respuestas de deshabilitar y rehabilitar (D10.6, D10.7)
export interface RespuestaDeshabilitar {
  usuario: UsuarioAdmin;
  publicacionesOcultadas: number;
}

export interface RespuestaRehabilitar {
  usuario: UsuarioAdmin;
  publicacionesRestauradas: number;
}

// Lo que se ve del perfil de otro usuario (sin correo ni fecha de nacimiento)
export interface PerfilPublico {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  descripcion: string;
  imagenPerfil: string;
  activo: boolean; // false solo lo ve un administrador
}

// Lo que devuelve autorizar: los datos del usuario y las fechas del mismo token (no emite uno nuevo)
export interface RespuestaAutorizar {
  usuario: Usuario;
  emitidoEn: string; // fecha ISO
  venceEn: string; // fecha ISO
}

// Lo que devuelven el login, el registro y refrescar
export interface RespuestaSesion {
  token: string;
  emitidoEn: string; // fecha ISO
  venceEn: string; // fecha ISO
  usuario: Usuario;
}
