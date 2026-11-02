import { Routes } from '@angular/router';
import { invitadoMatch, sesionMatch } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/publicaciones', pathMatch: 'full' },
  {
    path: 'login',
    canMatch: [invitadoMatch],
    loadComponent: () => import('./componentes/compartido/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canMatch: [invitadoMatch],
    loadComponent: () => import('./componentes/compartido/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'publicaciones',
    canMatch: [sesionMatch],
    loadComponent: () =>
      import('./componentes/cliente/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    path: 'perfil',
    canMatch: [sesionMatch],
    loadComponent: () => import('./componentes/cliente/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: 'sin-permiso',
    loadComponent: () =>
      import('./componentes/compartido/sin-permiso/sin-permiso').then((m) => m.SinPermiso),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./componentes/compartido/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
  },
];
