import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// Exige sesión iniciada; si no hay, va al login
export const sesionMatch: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.esperarInicio();
  return auth.haySesion() ? true : router.createUrlTree(['/login']);
};

// Para /login y /registro: si ya hay sesión, va a las publicaciones
export const invitadoMatch: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.esperarInicio();
  return auth.haySesion() ? router.createUrlTree(['/publicaciones']) : true;
};

// Solo administradores (se usa desde el sprint 4). Sin sesión va al login; con otro perfil, a "sin permiso".
export const adminMatch: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.esperarInicio();
  if (!auth.haySesion()) return router.createUrlTree(['/login']);
  return auth.esAdministrador() ? true : router.createUrlTree(['/sin-permiso']);
};
