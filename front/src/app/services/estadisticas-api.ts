import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ComentariosDePublicacion,
  ComentariosDeUnDia,
  Lapso,
  OpcionesRanking,
  PublicacionesDeUsuario,
} from '../modelos/estadisticas';

// Llamadas a la API de estadísticas, solo para administradores (el token lo agrega el interceptor)
@Service()
export class EstadisticasApi {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/estadisticas`;

  publicacionesPorUsuario(lapso: Lapso, ranking: OpcionesRanking) {
    return firstValueFrom(
      this.http.get<PublicacionesDeUsuario[]>(`${this.url}/publicaciones-por-usuario`, {
        params: { ...lapso, ...ranking },
      }),
    );
  }

  comentariosPorDia(lapso: Lapso) {
    return firstValueFrom(
      this.http.get<ComentariosDeUnDia[]>(`${this.url}/comentarios-por-dia`, { params: { ...lapso } }),
    );
  }

  comentariosPorPublicacion(lapso: Lapso, ranking: OpcionesRanking, incluirSinComentarios: boolean) {
    return firstValueFrom(
      this.http.get<ComentariosDePublicacion[]>(`${this.url}/comentarios-por-publicacion`, {
        params: { ...lapso, ...ranking, incluirSinComentarios },
      }),
    );
  }
}
