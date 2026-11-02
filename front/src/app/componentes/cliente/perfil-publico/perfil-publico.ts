import { Component, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PerfilPublico as PerfilPublicoDatos } from '../../../modelos/usuario';
import { Auth } from '../../../services/auth';
import { UsuariosApi } from '../../../services/usuarios-api';
import { Avatar } from '../../compartido/avatar/avatar';
import { ListadoPublicaciones } from '../listado-publicaciones/listado-publicaciones';

// Perfil de otro usuario: lo que él mismo muestra (sin correo ni fecha de nacimiento) y sus publicaciones
@Component({
  imports: [Avatar, ListadoPublicaciones, RouterLink],
  selector: 'app-perfil-publico',
  templateUrl: './perfil-publico.html',
  styleUrl: './perfil-publico.css',
})
export class PerfilPublico {
  private api = inject(UsuariosApi);
  private auth = inject(Auth);
  private router = inject(Router);

  protected id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  protected perfil = signal<PerfilPublicoDatos | null>(null);
  protected estado = signal<'cargando' | 'listo' | 'noExiste' | 'error'>('cargando');

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.cargar(id));
    });
  }

  protected async cargar(id: string) {
    // Mi propio perfil se ve en "Mi perfil"
    if (id === this.auth.usuario()?.id) {
      await this.router.navigate(['/perfil'], { replaceUrl: true });
      return;
    }
    this.estado.set('cargando');
    try {
      this.perfil.set(await this.api.perfilPublico(id));
      if (id === this.id()) this.estado.set('listo');
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (id === this.id()) this.estado.set(status === 404 || status === 400 ? 'noExiste' : 'error');
    }
  }
}
