import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from '../services/auth';

// Se rechaza en el navegador, sin llegar a la API, con la misma forma que un 401 real
function sesionVencida(url: string) {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        url,
        error: { message: 'La sesión venció' },
      }),
  );
}

// Si no hay sesión (por ejemplo, ya se cerró), la petición a la API no se envía.
// Un token vencido SÍ se envía: cuando la API responde 401, se cierra la sesión, se lleva al login
// y se avisa (visible en la pestaña Network). Lo mismo con el 403 de cuenta deshabilitada. El login y el registro quedan afuera: ahí un 401
// significa "credenciales incorrectas", no "sesión vencida".
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const esDeLaApi = req.url.startsWith(environment.apiUrl);
  const esDeAutenticacion = req.url.startsWith(`${environment.apiUrl}/autenticacion/`);
  const token = auth.token();

  if (esDeLaApi && !esDeAutenticacion) {
    if (!token) return sesionVencida(req.url);
  }

  const peticion =
    token && esDeLaApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && esDeLaApi && !esDeAutenticacion) {
        auth.alVencer();
      }
      // 403 con el código de cuenta deshabilitada (otros 403, como "solo el autor puede editar", pasan de largo)
      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        esDeLaApi &&
        !esDeAutenticacion &&
        error.error?.codigo === 'CUENTA_DESHABILITADA'
      ) {
        auth.alDeshabilitar();
      }
      return throwError(() => error);
    }),
  );
};
