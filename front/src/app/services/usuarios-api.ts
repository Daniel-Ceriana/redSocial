import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PerfilPublico } from '../modelos/usuario';

@Service()
export class UsuariosApi {
  private http = inject(HttpClient);

  perfilPublico(id: string) {
    return firstValueFrom(this.http.get<PerfilPublico>(`${environment.apiUrl}/usuarios/${id}`));
  }
}
