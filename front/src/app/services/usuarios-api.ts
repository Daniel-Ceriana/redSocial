import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pagina } from '../modelos/publicacion';
import {
  PerfilPublico,
  RespuestaDeshabilitar,
  RespuestaRehabilitar,
  UsuarioAdmin,
} from '../modelos/usuario';

export const USUARIOS_POR_PAGINA = 10;

// Llamadas a la API de usuarios (el token lo agrega el interceptor)
@Service()
export class UsuariosApi {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/usuarios`;

  perfilPublico(id: string) {
    return firstValueFrom(this.http.get<PerfilPublico>(`${this.url}/${id}`));
  }

  // ---------- Solo administradores (S10) ----------

  // `pagina` empieza en 1
  listar(pagina: number) {
    const params = { offset: (pagina - 1) * USUARIOS_POR_PAGINA, limit: USUARIOS_POR_PAGINA };
    return firstValueFrom(this.http.get<Pagina<UsuarioAdmin>>(this.url, { params }));
  }

  // multipart: los campos del registro + "perfil" + "imagen" opcional
  alta(cuerpo: FormData) {
    return firstValueFrom(this.http.post<UsuarioAdmin>(this.url, cuerpo));
  }

  deshabilitar(id: string, ocultarPublicaciones: boolean) {
    const params = { ocultarPublicaciones: String(ocultarPublicaciones) };
    return firstValueFrom(this.http.delete<RespuestaDeshabilitar>(`${this.url}/${id}`, { params }));
  }

  rehabilitar(id: string) {
    return firstValueFrom(this.http.post<RespuestaRehabilitar>(`${this.url}/${id}/rehabilitar`, {}));
  }
}
