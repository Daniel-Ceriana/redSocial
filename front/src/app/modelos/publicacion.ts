export interface AutorPublicacion {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagenPerfil: string;
}

export interface Publicacion {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  fecha: string; // fecha ISO
  autor: AutorPublicacion;
  cantidadMeGusta: number;
  yoMeGusta: boolean;
  cantidadComentarios: number;
}

// Forma de los listados de la API
export interface Pagina<T> {
  datos: T[];
  total: number;
  offset: number;
  limit: number;
}

// Lo que devuelven dar y quitar me gusta
export interface EstadoMeGusta {
  cantidadMeGusta: number;
  yoMeGusta: boolean;
}

export type OrdenPublicaciones = 'fecha' | 'meGusta';

export const PUBLICACIONES_POR_PAGINA = 5;
