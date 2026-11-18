import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// Solo mira si hay sesión abierta. El vencimiento del token no se chequea acá: lo detecta el back con un 401.
function haySesionVigente(auth: Auth): boolean {
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

// Solo administradores (me queda para el sprint 4). Sin sesión va al login; con otro perfil, a "sin permiso".
export const adminMatch: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.esperarInicio();
  if (!haySesionVigente(auth)) return router.createUrlTree(['/login']);
  return auth.esAdministrador() ? true : router.createUrlTree(['/sin-permiso']);
};
