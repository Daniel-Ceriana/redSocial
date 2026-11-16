import { AutoOcultar } from '../../../directivas/auto-ocultar';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ComentarioPublicacion } from '../../../modelos/comentario';
import { Publicacion } from '../../../modelos/publicacion';
import { Modal } from '../../../services/modal';
import { PublicacionesApi } from '../../../services/publicaciones-api';
import { mensajesDeError } from '../../../utilidades/errores';
import { LARGO_MAXIMO_COMENTARIO, mensajeComentario } from '../../../utilidades/validaciones';
import { Cargando } from '../../compartido/cargando/cargando';
import { Comentario } from '../../compartido/comentario/comentario';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

// Comentarios por carga, la primera y cada "cargar más" (D8.1)
const COMENTARIOS_POR_CARGA = 3;

// Página de una publicación (3.F1): la publicación en grande, el formulario para comentar (3.F2) y los
// comentarios, de a 3 con "cargar más" (3.F3); el autor edita los suyos en el mismo cartel (3.F4).
@Component({
  imports: [AutoOcultar, TarjetaPublicacion, Comentario, Cargando, FormField, RouterLink],
  selector: 'app-pagina-publicacion',
  templateUrl: './pagina-publicacion.html',
  styleUrl: './pagina-publicacion.css',
})
export class PaginaPublicacion {
  private api = inject(PublicacionesApi);
  private modal = inject(Modal);
  private router = inject(Router);

  protected readonly LARGO_MAXIMO = LARGO_MAXIMO_COMENTARIO;

  protected id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  protected estado = signal<'cargando' | 'listo' | 'noExiste' | 'error'>('cargando');
  protected publicacion = signal<Publicacion | null>(null);

  protected comentarios = signal<ComentarioPublicacion[]>([]);
  protected totalComentarios = signal(0);
  protected cargandoMas = signal(false);
  protected aviso = signal('');

  // Hasta qué posición de la lista del back ya se pidió (es el offset del próximo "cargar más").
  // Va aparte de comentarios().length porque los repetidos que se descartan también ocupan lugar (D7.3).
  private posicion = 0;
  protected hayMas = signal(false);


  protected model = signal({ mensaje: '' });
  protected comentarioForm = form(this.model, (p) => {
    mensajeComentario(p.mensaje);
  });

  protected largoMensaje = computed(() => this.model().mensaje.trim().length);

  constructor() {
    // Carga al abrir y si cambia el id de la URL
    effect(() => {
      const id = this.id();
      untracked(() => void this.cargar(id));
    });
  }

  protected async cargar(id: string) {
    this.estado.set('cargando');
    try {
      const [publicacion, pagina] = await Promise.all([
        this.api.obtener(id),
        this.api.comentarios(id, COMENTARIOS_POR_CARGA),
      ]);
      if (id !== this.id()) return; // llegó tarde: ya se está viendo otra
      this.publicacion.set(publicacion);
      this.comentarios.set(pagina.datos);
      this.totalComentarios.set(pagina.total);
      this.posicion = pagina.datos.length;
      this.hayMas.set(this.posicion < pagina.total);
      this.estado.set('listo');
    } catch (error) {
      if (id !== this.id()) return;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.estado.set(status === 404 || status === 400 ? 'noExiste' : 'error');
    }
  }

  // Suma los siguientes sin perder los anteriores. Si mientras tanto alguien comentó, la lista del back se
  // corrió un lugar y puede volver uno que ya está: se descarta por id.
  protected async cargarMas() {
    const id = this.id();
    this.cargandoMas.set(true);
    try {
      const pagina = await this.api.comentarios(id, COMENTARIOS_POR_CARGA, this.posicion);
      const yaEstan = new Set(this.comentarios().map((c) => c.id));
      this.comentarios.update((lista) => [...lista, ...pagina.datos.filter((c) => !yaEstan.has(c.id))]);
      this.posicion += pagina.datos.length;
      this.totalComentarios.set(pagina.total);
      this.hayMas.set(this.posicion < pagina.total);
    } catch (error) {
      await this.modal.avisar('No se pudieron cargar más comentarios', mensajesDeError(error));
    } finally {
      this.cargandoMas.set(false);
    }
  }

  async comentar(event: Event) {
    event.preventDefault();
    await submit(this.comentarioForm, async () => {
      const id = this.id();
      try {
        const nuevo = await this.api.comentar(id, this.model().mensaje.trim());
        // Va primero (es el más nuevo) y corre un lugar la lista del back
        this.comentarios.update((lista) => [nuevo, ...lista]);
        this.totalComentarios.update((t) => t + 1);
        this.posicion++;
        this.publicacion.update((p) => (p ? { ...p, cantidadComentarios: p.cantidadComentarios + 1 } : p));
        this.model.set({ mensaje: '' });
        this.comentarioForm().reset();
        this.mostrarAviso('Comentario publicado');
      } catch (error) {
        await this.modal.avisar('No se pudo publicar el comentario', mensajesDeError(error));
        // Si la publicación ya no existe (la dieron de baja), se vuelve a cargar y se muestra el 404
        if (error instanceof HttpErrorResponse && error.status === 404) void this.cargar(id);
      }
    });
  }

  protected reemplazarComentario(editado: ComentarioPublicacion) {
    this.comentarios.update((lista) => lista.map((c) => (c.id === editado.id ? editado : c)));
    this.mostrarAviso('Comentario editado');
  }

  protected async alEliminar() {
    await this.router.navigate(['/publicaciones']);
    void this.modal.avisar('Publicación eliminada', 'La publicación y sus comentarios ya no están disponibles.');
  }

  // El aviso se borra solo a los 4 segundos (directiva appAutoOcultar en la plantilla)
  private mostrarAviso(mensaje: string) {
    this.aviso.set(mensaje);
  }
}
