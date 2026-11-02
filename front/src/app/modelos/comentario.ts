import { AutorPublicacion } from './publicacion';

export interface ComentarioPublicacion {
  id: string;
  publicacion: string;
  autor: AutorPublicacion;
  mensaje: string;
  modificado: boolean;
  fecha: string; // fecha ISO
}
