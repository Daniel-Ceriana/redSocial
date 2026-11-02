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

// Lo que devuelven el login y el registro
export interface RespuestaSesion {
  token: string;
  venceEn: string; // fecha ISO
  usuario: Usuario;
}
