import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuarioAdmin } from '../../../modelos/usuario';
import { Auth } from '../../../services/auth';
import { Modal } from '../../../services/modal';
import { USUARIOS_POR_PAGINA, UsuariosApi } from '../../../services/usuarios-api';
import { mensajesDeError } from '../../../utilidades/errores';
import { Avatar } from '../../compartido/avatar/avatar';
import { Cargando } from '../../compartido/cargando/cargando';

// dashboard/usuarios (4.F2): tabla tipo planilla (D11.2), paginada de a 10, con deshabilitar y rehabilitar.
// Las acciones actualizan la fila sin volver a pedir la lista.
@Component({
  imports: [Avatar, Cargando, RouterLink],
  selector: 'app-dashboard-usuarios',
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.css',
})
export class DashboardUsuarios implements OnInit {
  private api = inject(UsuariosApi);
  private modal = inject(Modal);
  protected auth = inject(Auth);

  protected usuarios = signal<UsuarioAdmin[]>([]);
  protected total = signal(0);
  protected pagina = signal(1);
  protected estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  protected ocupado = signal<string | null>(null); // id del usuario con una acción en curso
  protected aviso = signal('');

  protected totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / USUARIOS_POR_PAGINA)));

  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    // Si se viene del alta, se muestra su aviso (llega en el estado de la navegación)
    const avisoAlta = (history.state as { aviso?: string } | null)?.aviso;
    if (avisoAlta) this.mostrarAviso(avisoAlta);
    void this.cargar();
  }

  protected async cargar() {
    this.estado.set('cargando');
    try {
      const respuesta = await this.api.listar(this.pagina());
      this.usuarios.set(respuesta.datos);
      this.total.set(respuesta.total);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  protected irAPagina(pagina: number) {
    this.pagina.set(pagina);
    void this.cargar();
  }

  // D11.3: tres botones; el administrador elige si se ocultan las publicaciones (D10.6)
  protected async deshabilitar(u: UsuarioAdmin) {
    const ocultar = await this.modal.elegir(`¿Deshabilitar a @${u.nombreUsuario}?`, [
      'No va a poder iniciar sesión hasta que lo rehabilites.',
      'Elegí qué pasa con sus publicaciones: si las ocultás, vuelven a verse cuando lo rehabilites.',
    ], [
      { texto: 'Cancelar', valor: null, estilo: 'secundario' },
      { texto: 'Deshabilitar y dejarlas visibles', valor: false, estilo: 'principal' },
      { texto: 'Deshabilitar y ocultar publicaciones', valor: true, estilo: 'peligro' },
    ]);
    if (ocultar === null) return;

    this.ocupado.set(u.id);
    try {
      const r = await this.api.deshabilitar(u.id, ocultar);
      this.reemplazar(r.usuario);
      this.mostrarAviso(
        `@${u.nombreUsuario} quedó deshabilitado.` +
          (ocultar ? ` Se ocultaron ${r.publicacionesOcultadas} ${plural(r.publicacionesOcultadas, 'publicación', 'publicaciones')}.` : ''),
      );
    } catch (error) {
      await this.modal.avisar('No se pudo deshabilitar', mensajesDeError(error));
      void this.cargar(); // por si el estado ya era otro
    } finally {
      this.ocupado.set(null);
    }
  }

  protected async rehabilitar(u: UsuarioAdmin) {
    const confirmado = await this.modal.confirmar(
      `¿Rehabilitar a @${u.nombreUsuario}?`,
      'Va a poder volver a iniciar sesión, y vuelven a verse las publicaciones que se ocultaron al deshabilitarlo.',
      'Rehabilitar',
    );
    if (!confirmado) return;

    this.ocupado.set(u.id);
    try {
      const r = await this.api.rehabilitar(u.id);
      this.reemplazar(r.usuario);
      this.mostrarAviso(
        `@${u.nombreUsuario} quedó habilitado. Se restauraron ${r.publicacionesRestauradas} ${plural(r.publicacionesRestauradas, 'publicación', 'publicaciones')}.`,
      );
    } catch (error) {
      await this.modal.avisar('No se pudo rehabilitar', mensajesDeError(error));
      void this.cargar();
    } finally {
      this.ocupado.set(null);
    }
  }

  private reemplazar(actualizado: UsuarioAdmin) {
    this.usuarios.update((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));
  }

  private mostrarAviso(mensaje: string) {
    clearTimeout(this.temporizadorAviso);
    this.aviso.set(mensaje);
    this.temporizadorAviso = setTimeout(() => this.aviso.set(''), 5000);
  }
}

function plural(n: number, singular: string, varias: string) {
  return n === 1 ? singular : varias;
}
