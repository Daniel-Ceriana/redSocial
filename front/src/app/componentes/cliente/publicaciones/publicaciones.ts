import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  OrdenPublicaciones,
  Publicacion,
  PUBLICACIONES_POR_PAGINA,
} from '../../../modelos/publicacion';
import { Modal } from '../../../services/modal';
import { PublicacionesApi } from '../../../services/publicaciones-api';
import { mensajesDeError } from '../../../utilidades/errores';
import { NuevaPublicacion } from '../nueva-publicacion/nueva-publicacion';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

@Component({
  imports: [NuevaPublicacion, TarjetaPublicacion],
  selector: 'app-publicaciones',
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {
  private api = inject(PublicacionesApi);
  private modal = inject(Modal);

  protected orden = signal<OrdenPublicaciones>('fecha');
  protected pagina = signal(1);
  protected publicaciones = signal<Publicacion[]>([]);
  protected total = signal(0);
  protected estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  protected aviso = signal('');
  // Ids de las publicaciones con una acción esperando respuesta de la API
  protected ocupadas = signal<ReadonlySet<string>>(new Set());

  protected totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / PUBLICACIONES_POR_PAGINA)),
  );

  // Cada pedido tiene un número; si llega una respuesta de uno viejo, se ignora
  private numeroPedido = 0;
  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const numero = ++this.numeroPedido;
    this.estado.set('cargando');
    try {
      const respuesta = await this.api.listar(this.orden(), this.pagina());
      if (numero !== this.numeroPedido) return;

      // La página ya no existe (por ejemplo, se eliminó la última publicación): se retrocede
      const ultima = Math.max(1, Math.ceil(respuesta.total / PUBLICACIONES_POR_PAGINA));
      if (this.pagina() > ultima) {
        this.pagina.set(ultima);
        return this.cargar();
      }
      this.publicaciones.set(respuesta.datos);
      this.total.set(respuesta.total);
      this.estado.set('listo');
    } catch {
      if (numero === this.numeroPedido) this.estado.set('error');
    }
  }

  protected cambiarOrden(orden: OrdenPublicaciones) {
    if (orden === this.orden()) return;
    this.orden.set(orden);
    this.pagina.set(1);
    void this.cargar();
  }

  protected irAPagina(pagina: number) {
    this.pagina.set(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void this.cargar();
  }

  // Después de crear, se muestra la primera página ordenada por fecha: ahí aparece la nueva
  protected alCrear() {
    this.orden.set('fecha');
    this.pagina.set(1);
    this.mostrarAviso('¡Publicación creada!');
    void this.cargar();
  }

  protected async alternarMeGusta(publicacion: Publicacion) {
    this.marcarOcupada(publicacion.id, true);
    try {
      const estado = publicacion.yoMeGusta
        ? await this.api.quitarMeGusta(publicacion.id)
        : await this.api.darMeGusta(publicacion.id);
      // Solo se actualiza esa tarjeta, con los números reales que devolvió la API
      this.publicaciones.update((lista) =>
        lista.map((p) => (p.id === publicacion.id ? { ...p, ...estado } : p)),
      );
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      if (status !== 409) {
        await this.modal.avisar('No se pudo actualizar el me gusta', mensajesDeError(error));
      }
      // 409: el estado ya era otro (por ejemplo, desde otro dispositivo); se vuelve a leer
      void this.cargar();
    } finally {
      this.marcarOcupada(publicacion.id, false);
    }
  }

  protected async eliminar(publicacion: Publicacion) {
    const confirmado = await this.modal.confirmar('Eliminar publicación', [
      `¿Querés eliminar "${publicacion.titulo}"? Esta acción no se puede deshacer.`,
    ]);
    if (!confirmado) return;

    this.marcarOcupada(publicacion.id, true);
    try {
      await this.api.eliminar(publicacion.id);
      this.mostrarAviso('Publicación eliminada');
    } catch (error) {
      await this.modal.avisar('No se pudo eliminar la publicación', mensajesDeError(error));
    } finally {
      this.marcarOcupada(publicacion.id, false);
    }
    // Se vuelve a pedir la página actual para que el total y las páginas coincidan
    void this.cargar();
  }

  private marcarOcupada(id: string, ocupada: boolean) {
    this.ocupadas.update((actuales) => {
      const nuevas = new Set(actuales);
      if (ocupada) nuevas.add(id);
      else nuevas.delete(id);
      return nuevas;
    });
  }

  private mostrarAviso(mensaje: string) {
    clearTimeout(this.temporizadorAviso);
    this.aviso.set(mensaje);
    this.temporizadorAviso = setTimeout(() => this.aviso.set(''), 4000);
  }
}
