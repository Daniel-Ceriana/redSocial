import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../services/auth';
import { Avatar } from '../avatar/avatar';

@Component({
  imports: [RouterLink, RouterLinkActive, Avatar],
  selector: 'app-nav',
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  private auth = inject(Auth);
  private router = inject(Router);

  protected usuario = this.auth.usuario;
  protected menuAbierto = signal(false);

  protected cerrarSesion() {
    this.auth.cerrarSesion();
    this.menuAbierto.set(false);
    this.router.navigate(['/login']);
  }
}
