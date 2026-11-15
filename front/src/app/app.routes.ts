import { Routes } from '@angular/router';
import { adminMatch, invitadoMatch, sesionMatch } from './guards/auth-guard';

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
    path: 'publicaciones/:id',
    canMatch: [sesionMatch],
    loadComponent: () =>
      import('./componentes/cliente/pagina-publicacion/pagina-publicacion').then(
        (m) => m.PaginaPublicacion,
      ),
  },
  {
    path: 'perfil',
    canMatch: [sesionMatch],
    loadComponent: () => import('./componentes/cliente/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: 'usuarios/:id',
    canMatch: [sesionMatch],
    loadComponent: () =>
      import('./componentes/cliente/perfil-publico/perfil-publico').then((m) => m.PerfilPublico),
  },
  // Solo administradores (4.F2): un usuario común va a "sin permiso" y sin sesión, al login
  {
    path: 'dashboard',
    canMatch: [adminMatch],
    loadComponent: () => import('./componentes/admin/dashboard/dashboard').then((m) => m.Dashboard),
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./componentes/admin/dashboard-usuarios/dashboard-usuarios').then(
            (m) => m.DashboardUsuarios,
          ),
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () =>
          import('./componentes/admin/alta-usuario/alta-usuario').then((m) => m.AltaUsuario),
      },
    ],
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
