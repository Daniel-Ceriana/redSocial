import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ComentarioPublicacion } from '../modelos/comentario';
import {
  EstadoMeGusta,
  OrdenPublicaciones,
  Pagina,
  Publicacion,
  PUBLICACIONES_POR_PAGINA,
} from '../modelos/publicacion';

interface OpcionesListado {
  usuarioId?: string; // solo las publicaciones de ese usuario
  limite?: number; // cuántas por página (por defecto, PUBLICACIONES_POR_PAGINA)
}

// Llamadas a la API de publicaciones (el token lo agrega el interceptor)
@Service()
export class PublicacionesApi {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/publicaciones`;

  // `pagina` empieza en 1
  listar(orden: OrdenPublicaciones, pagina: number, opciones: OpcionesListado = {}) {
    const limite = opciones.limite ?? PUBLICACIONES_POR_PAGINA;
    const params: Record<string, string | number> = {
      orden,
      offset: (pagina - 1) * limite,
      limit: limite,
    };
    if (opciones.usuarioId) params['usuario'] = opciones.usuarioId;
    return firstValueFrom(this.http.get<Pagina<Publicacion>>(this.url, { params }));
  }

  // Los comentarios más recientes de una publicación
  comentarios(id: string, limite: number) {
    const params = { offset: 0, limit: limite };
    return firstValueFrom(
      this.http.get<Pagina<ComentarioPublicacion>>(`${this.url}/${id}/comentarios`, { params }),
    );
  }

  crear(cuerpo: FormData) {
    return firstValueFrom(this.http.post<Publicacion>(this.url, cuerpo));
  }

  eliminar(id: string) {
    return firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }

  darMeGusta(id: string) {
    return firstValueFrom(this.http.post<EstadoMeGusta>(`${this.url}/${id}/me-gusta`, {}));
  }

  quitarMeGusta(id: string) {
    return firstValueFrom(this.http.delete<EstadoMeGusta>(`${this.url}/${id}/me-gusta`));
  }
}
