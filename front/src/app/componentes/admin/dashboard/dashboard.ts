import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// Sección solo para administradores (adminMatch en las rutas): título, sub-navegación y la pantalla elegida
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-dashboard',
  template: `
    <h1 class="cartel-titulo">Dashboard</h1>
    <nav class="subnav" aria-label="Dashboard">
      <a routerLink="usuarios" routerLinkActive="activo">Usuarios</a>
    </nav>
    <router-outlet />
  `,
  styles: `
    .subnav {
      display: flex;
      gap: 0.5rem;
      margin: 0 0 1.25rem;
      border-bottom: 2px solid var(--borde);
    }

    .subnav a {
      padding: 0.4rem 0.9rem;
      margin-bottom: -2px;
      font-weight: 600;
      color: var(--gris);
      text-decoration: none;
      border-bottom: 3px solid transparent;
    }

    .subnav a.activo {
      color: var(--verde);
      border-bottom-color: var(--ocre);
    }

    .subnav a:focus-visible {
      outline: 3px solid var(--ocre);
      outline-offset: 2px;
    }
  `,
})
export class Dashboard {}
