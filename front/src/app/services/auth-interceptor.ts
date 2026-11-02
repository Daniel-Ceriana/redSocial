import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from './auth';

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

// Antes de cada petición a nuestra API (salvo login y registro) revisa la sesión:
//  - si el token ya venció, cierra la sesión, lleva al login y avisa; la petición no se envía;
//  - si no hay sesión (por ejemplo, ya se cerró), tampoco se envía.
// Si igual la API responde 401, hace lo mismo. El login y el registro quedan afuera: ahí un 401
// significa "credenciales incorrectas", no "sesión vencida".
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const esDeLaApi = req.url.startsWith(environment.apiUrl);
  const esDeAutenticacion = req.url.startsWith(`${environment.apiUrl}/autenticacion/`);
  const token = auth.token();

  if (esDeLaApi && !esDeAutenticacion) {
    if (token && auth.tokenVencido()) {
      auth.alVencer();
      return sesionVencida(req.url);
    }
    if (!token) return sesionVencida(req.url);
  }

  const peticion =
    token && esDeLaApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && esDeLaApi && !esDeAutenticacion) {
        auth.alVencer();
      }
      return throwError(() => error);
    }),
  );
};
