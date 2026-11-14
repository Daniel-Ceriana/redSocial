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

// Lo que se ve del perfil de otro usuario (sin correo ni fecha de nacimiento)
export interface PerfilPublico {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  descripcion: string;
  imagenPerfil: string;
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
