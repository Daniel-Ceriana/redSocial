import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from './auth';

// Agrega "Authorization: Bearer <token>" a las llamadas a nuestra API y, si la API rechaza el
// token (401) con la sesión abierta, cierra la sesión y avisa. El login y el registro quedan afuera:
// ahí un 401 significa "credenciales incorrectas", no "sesión vencida".
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const esDeLaApi = req.url.startsWith(environment.apiUrl);
  const token = auth.token();

  const peticion =
    token && esDeLaApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const esDeAutenticacion = req.url.startsWith(`${environment.apiUrl}/autenticacion/`);

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && esDeLaApi && !esDeAutenticacion) {
        auth.alVencer();
      }
      return throwError(() => error);
    }),
  );
};
