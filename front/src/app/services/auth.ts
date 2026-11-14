import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaSesion, Usuario } from '../modelos/usuario';
import { Modal } from './modal';

const CLAVE_SESION = 'trochita.sesion';

interface SesionGuardada {
  token: string;
  emitidoEn?: string; // las sesiones guardadas antes de este cambio no lo tienen
  venceEn: string;
}

@Service()
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private modal = inject(Modal);

  private _token = signal<string | null>(null);
  private _emitidoEn = signal<string | null>(null);
  private _venceEn = signal<string | null>(null);

  // A la mitad de la vida del token se ofrece extenderla; al vencer se cierra la sesión
  private temporizadorAviso?: ReturnType<typeof setTimeout>;
  private temporizadorVencimiento?: ReturnType<typeof setTimeout>;
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
      const { token, emitidoEn, venceEn } = JSON.parse(guardado) as SesionGuardada;
      if (new Date(venceEn).getTime() <= Date.now()) {
        // Ya venció mientras la app estaba cerrada: ni hace falta preguntarle al back
        this.cerrarSesion();
        this.avisarVencimiento();
        return;
      }
      this._token.set(token);
      this._emitidoEn.set(emitidoEn ?? null);
      this._venceEn.set(venceEn);
      this._usuario.set(await this.pedirUsuario());
      this.programarTemporizadores();
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

  // Pide un token nuevo con 30 segundos más de vida (3.B7). Si el back lo rechaza (401: ya venció),
  // se cierra la sesión como en cualquier otro vencimiento.
  async extenderSesion() {
    try {
      const res = await firstValueFrom(
        this.http.post<RespuestaSesion>(`${environment.apiUrl}/autenticacion/refrescar`, {}),
      );
      this.guardarSesion(res);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.alVencer();
      } else {
        await this.modal.avisar(
          'No se pudo extender la sesión',
          'Revisá tu conexión. La sesión sigue hasta que venza.',
        );
      }
    }
  }

  cerrarSesion() {
    this.limpiarEnMemoria();
    localStorage.removeItem(CLAVE_SESION);
  }

  // ¿Ya pasó la hora de vencimiento del token? Se chequea en cada acción del usuario.
  tokenVencido(): boolean {
    const venceEn = this._venceEn();
    return venceEn !== null && new Date(venceEn).getTime() <= Date.now();
  }

  // La sesión ya no sirve (venció el token o la API lo rechazó): se cierra, se lleva al login
  // (salvo que quien llama ya lo esté redirigiendo) y se avisa
  alVencer(irAlLogin = true) {
    if (!this.haySesion()) return; // ya se cerró (por ejemplo, otra petición también dio 401)
    this.cerrarSesion();
    if (irAlLogin) void this.router.navigate(['/login']);
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

  private pedirUsuario() {
    return firstValueFrom(this.http.get<Usuario>(`${environment.apiUrl}/usuarios/yo`));
  }

  private guardarSesion(res: RespuestaSesion) {
    this._token.set(res.token);
    this._emitidoEn.set(res.emitidoEn);
    this._venceEn.set(res.venceEn);
    this._usuario.set(res.usuario);
    const guardada: SesionGuardada = {
      token: res.token,
      emitidoEn: res.emitidoEn,
      venceEn: res.venceEn,
    };
    localStorage.setItem(CLAVE_SESION, JSON.stringify(guardada));
    this.programarTemporizadores();
  }

  // Programa los dos momentos de la sesión actual (y descarta los de un token anterior):
  //  - a la mitad de la vida del token, el modal que ofrece extenderla (3.F7);
  //  - al vencer, cerrar la sesión, ir al login y avisar, aunque la persona no haga nada.
  private programarTemporizadores() {
    this.cancelarTemporizadores();
    const venceEn = this._venceEn();
    if (!venceEn) return;

    const vence = new Date(venceEn).getTime();
    const emitido = this._emitidoEn() ? new Date(this._emitidoEn()!).getTime() : null;
    const ahora = Date.now();

    this.temporizadorVencimiento = setTimeout(() => this.alVencer(), Math.max(0, vence - ahora));

    // Sin la fecha de emisión (sesión guardada antes de este cambio) no se sabe cuál es la mitad
    if (emitido === null) return;
    const mitad = emitido + (vence - emitido) / 2;
    if (mitad > ahora) {
      this.temporizadorAviso = setTimeout(() => void this.ofrecerExtender(), mitad - ahora);
    }
  }

  private async ofrecerExtender() {
    const segundos = Math.max(1, Math.round((new Date(this._venceEn()!).getTime() - Date.now()) / 1000));
    const extender = await this.modal.confirmar(
      '¿Extender la sesión?',
      [
        `Tu sesión vence en ${segundos} segundos.`,
        'Si la extendés, vas a tener 30 segundos más desde ahora.',
      ],
      'Extender',
    );
    // Si eligió "Cancelar", no hay otro aviso: al vencer se cierra la sesión.
    // Si mientras tanto venció (el modal de vencimiento reemplaza a este), tampoco se hace nada.
    if (extender && this.haySesion() && !this.tokenVencido()) await this.extenderSesion();
  }

  private cancelarTemporizadores() {
    clearTimeout(this.temporizadorAviso);
    clearTimeout(this.temporizadorVencimiento);
  }

  private limpiarEnMemoria() {
    this.cancelarTemporizadores();
    this._token.set(null);
    this._emitidoEn.set(null);
    this._venceEn.set(null);
    this._usuario.set(null);
  }
}
