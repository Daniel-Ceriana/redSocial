import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaSesion, Usuario } from '../modelos/usuario';

const CLAVE_SESION = 'trochita.sesion';

@Service()
export class Auth {
  private http = inject(HttpClient);

  private _token = signal<string | null>(null);
  private _venceEn = signal<string | null>(null);
  private _usuario = signal<Usuario | null>(null);

  readonly token = this._token.asReadonly();
  readonly venceEn = this._venceEn.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly haySesion = computed(() => this._usuario() !== null);
  readonly esAdministrador = computed(() => this._usuario()?.perfil === 'administrador');

  // Se resuelve cuando ya se sabe si hay sesión válida al abrir la aplicación
  private inicio: Promise<void>;

  constructor() {
    // Se difiere un instante: el interceptor necesita esta instancia ya construida
    this.inicio = Promise.resolve().then(() => this.restaurar());
  }

  esperarInicio() {
    return this.inicio;
  }

  // Si hay un token guardado, lo valida pidiendo los datos del usuario al back
  private async restaurar() {
    const guardado = localStorage.getItem(CLAVE_SESION);
    if (!guardado) return;
    try {
      const { token, venceEn } = JSON.parse(guardado) as { token: string; venceEn: string };
      this._token.set(token);
      this._venceEn.set(venceEn);
      this._usuario.set(await this.pedirUsuario());
    } catch (error) {
      this.limpiarEnMemoria();
      // Token inválido o vencido: se borra. Si solo falló la red, queda guardado para la próxima.
      const sinConexion = error instanceof HttpErrorResponse && error.status === 0;
      if (!sinConexion) localStorage.removeItem(CLAVE_SESION);
    }
  }

  async registro(datos: FormData) {
    const res = await firstValueFrom(
      this.http.post<RespuestaSesion>(`${environment.apiUrl}/autenticacion/registro`, datos),
    );
    this.guardarSesion(res);
  }

  async login(correo: string, contrasena: string) {
    const res = await firstValueFrom(
      this.http.post<RespuestaSesion>(`${environment.apiUrl}/autenticacion/login`, {
        correo,
        contrasena,
      }),
    );
    this.guardarSesion(res);
  }

  // Edita el perfil (multipart) y deja los datos nuevos en la sesión. El token sigue siendo el mismo.
  async actualizarPerfil(cuerpo: FormData) {
    const usuario = await firstValueFrom(
      this.http.patch<Usuario>(`${environment.apiUrl}/usuarios/yo`, cuerpo),
    );
    this._usuario.set(usuario);
  }

  // Vuelve a leer los datos del usuario logueado desde el back
  async refrescarUsuario() {
    this._usuario.set(await this.pedirUsuario());
  }

  cerrarSesion() {
    this.limpiarEnMemoria();
    localStorage.removeItem(CLAVE_SESION);
  }

  private pedirUsuario() {
    return firstValueFrom(this.http.get<Usuario>(`${environment.apiUrl}/usuarios/yo`));
  }

  private guardarSesion(res: RespuestaSesion) {
    this._token.set(res.token);
    this._venceEn.set(res.venceEn);
    this._usuario.set(res.usuario);
    localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: res.token, venceEn: res.venceEn }),
    );
  }

  private limpiarEnMemoria() {
    this._token.set(null);
    this._venceEn.set(null);
    this._usuario.set(null);
  }
}
