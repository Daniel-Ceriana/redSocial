import { HttpErrorResponse } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Publicacion } from '../modelos/publicacion';
import { mensajesDeError } from '../utilidades/errores';
import { Modal } from './modal';
import { PublicacionesApi } from './publicaciones-api';

// Dar/quitar me gusta y eliminar, con sus avisos. Lo usan todas las pantallas que muestran tarjetas.
@Service()
export class AccionesPublicacion {
  private api = inject(PublicacionesApi);
  private modal = inject(Modal);

  // Ids de las publicaciones con una acción esperando respuesta de la API
  private ocupadas = signal<ReadonlySet<string>>(new Set());

  estaOcupada(id: string): boolean {
    return this.ocupadas().has(id);
  }

  // Devuelve la publicación con los números reales, o null si hay que volver a leerla de la API
  async alternarMeGusta(publicacion: Publicacion): Promise<Publicacion | null> {
    this.marcar(publicacion.id, true);
    try {
      const estado = publicacion.yoMeGusta
        ? await this.api.quitarMeGusta(publicacion.id)
        : await this.api.darMeGusta(publicacion.id);
      return { ...publicacion, ...estado };
    } catch (error) {
      // 409: el estado ya era otro (por ejemplo, desde otro dispositivo); alcanza con volver a leer
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      if (status !== 409) {
        await this.modal.avisar('No se pudo actualizar el me gusta', mensajesDeError(error));
      }
      return null;
    } finally {
      this.marcar(publicacion.id, false);
    }
  }

  async eliminar(publicacion: Publicacion): Promise<'eliminada' | 'cancelada' | 'error'> {
    const confirmado = await this.modal.confirmar('Eliminar publicación', [
      `¿Querés eliminar "${publicacion.titulo}"? Esta acción no se puede deshacer.`,
    ]);
    if (!confirmado) return 'cancelada';

    this.marcar(publicacion.id, true);
    try {
      await this.api.eliminar(publicacion.id);
      return 'eliminada';
    } catch (error) {
      await this.modal.avisar('No se pudo eliminar la publicación', mensajesDeError(error));
      return 'error';
    } finally {
      this.marcar(publicacion.id, false);
    }
  }

  private marcar(id: string, ocupada: boolean) {
    this.ocupadas.update((actuales) => {
      const nuevas = new Set(actuales);
      if (ocupada) nuevas.add(id);
      else nuevas.delete(id);
      return nuevas;
    });
  }
}
