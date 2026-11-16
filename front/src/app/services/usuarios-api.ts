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
// Como LARGO_MAXIMO_BUSQUEDA del back (dto/consulta-usuarios.dto.ts)
export const LARGO_MAXIMO_BUSQUEDA = 100;

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
  // `buscar` (opcional): texto que tiene que estar en el correo o en el nombre de usuario
  listar(pagina: number, buscar = '') {
    const params: Record<string, string | number> = {
      offset: (pagina - 1) * USUARIOS_POR_PAGINA,
      limit: USUARIOS_POR_PAGINA,
    };
    if (buscar) params['buscar'] = buscar;
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
