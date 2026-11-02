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

// Lo que devuelven el login y el registro
export interface RespuestaSesion {
  token: string;
  venceEn: string; // fecha ISO
  usuario: Usuario;
}
