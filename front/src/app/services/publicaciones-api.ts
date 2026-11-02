import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EstadoMeGusta,
  OrdenPublicaciones,
  Pagina,
  Publicacion,
  PUBLICACIONES_POR_PAGINA,
} from '../modelos/publicacion';

// Llamadas a la API de publicaciones (el token lo agrega el interceptor)
@Service()
export class PublicacionesApi {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/publicaciones`;

  // `pagina` empieza en 1
  listar(orden: OrdenPublicaciones, pagina: number) {
    const params = {
      orden,
      offset: (pagina - 1) * PUBLICACIONES_POR_PAGINA,
      limit: PUBLICACIONES_POR_PAGINA,
    };
    return firstValueFrom(this.http.get<Pagina<Publicacion>>(this.url, { params }));
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
