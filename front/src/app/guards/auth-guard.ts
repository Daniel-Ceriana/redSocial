import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// Hay sesión y el token no venció. Si venció, se cierra la sesión y se avisa (sin redirigir: lo hace el guard).
function haySesionVigente(auth: Auth): boolean {
  if (auth.haySesion() && auth.tokenVencido()) auth.alVencer(false);
  return auth.haySesion();
}

// Exige sesión iniciada y vigente; si no hay, va al login
export const sesionMatch: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.esperarInicio();
  return haySesionVigente(auth) ? true : router.createUrlTree(['/login']);
};

// Para /login y /registro: si ya hay sesión, va a las publicaciones
export const invitadoMatch: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.esperarInicio();
  return haySesionVigente(auth) ? router.createUrlTree(['/publicaciones']) : true;
};

// Solo administradores (se usa desde el sprint 4). Sin sesión va al login; con otro perfil, a "sin permiso".
export const adminMatch: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.esperarInicio();
  if (!haySesionVigente(auth)) return router.createUrlTree(['/login']);
  return auth.esAdministrador() ? true : router.createUrlTree(['/sin-permiso']);
};
