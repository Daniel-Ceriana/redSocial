import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaSesion, Usuario } from '../modelos/usuario';
import { Modal } from './modal';

const CLAVE_SESION = 'trochita.sesion';

@Service()
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private modal = inject(Modal);

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
  // Avisa cuando llega la hora en que vence el token
  private temporizadorVencimiento?: ReturnType<typeof setTimeout>;

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
      if (new Date(venceEn).getTime() <= Date.now()) {
        // Ya venció mientras la app estaba cerrada: ni hace falta preguntarle al back
        this.cerrarSesion();
        this.avisarVencimiento();
        return;
      }
      this._token.set(token);
      this._venceEn.set(venceEn);
      this._usuario.set(await this.pedirUsuario());
      this.programarVencimiento(venceEn);
    } catch (error) {
      this.limpiarEnMemoria();
      // Token inválido o vencido: se borra. Si solo falló la red, queda guardado para la próxima.
      const sinConexion = error instanceof HttpErrorResponse && error.status === 0;
      if (!sinConexion) localStorage.removeItem(CLAVE_SESION);
      if (error instanceof HttpErrorResponse && error.status === 401) this.avisarVencimiento();
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
    clearTimeout(this.temporizadorVencimiento);
    this.limpiarEnMemoria();
    localStorage.removeItem(CLAVE_SESION);
  }

  // La sesión ya no sirve (venció el token o la API lo rechazó): se cierra, se lleva al login y se avisa
  alVencer() {
    if (!this.haySesion()) return; // ya se cerró (por ejemplo, otra petición también dio 401)
    this.cerrarSesion();
    void this.router.navigate(['/login']);
    this.avisarVencimiento();
  }

  private avisarVencimiento() {
    // Sin await: el aviso no tiene que frenar la navegación
    void this.modal.avisar(
      'Tu sesión venció',
      'Por seguridad, la sesión dura un tiempo limitado. Iniciá sesión de nuevo para seguir.',
      true,
    );
  }

  private programarVencimiento(venceEn: string) {
    clearTimeout(this.temporizadorVencimiento);
    const falta = new Date(venceEn).getTime() - Date.now();
    this.temporizadorVencimiento = setTimeout(() => this.alVencer(), Math.max(0, falta));
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
    this.programarVencimiento(res.venceEn);
  }

  private limpiarEnMemoria() {
    this._token.set(null);
    this._venceEn.set(null);
    this._usuario.set(null);
  }
}
