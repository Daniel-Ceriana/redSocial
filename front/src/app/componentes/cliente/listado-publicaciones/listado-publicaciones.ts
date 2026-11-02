import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import {
  OrdenPublicaciones,
  Publicacion,
  PUBLICACIONES_POR_PAGINA,
} from '../../../modelos/publicacion';
import { PublicacionesApi } from '../../../services/publicaciones-api';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

// Listado de tarjetas con orden y paginación. Con `usuarioId` muestra solo las de ese usuario.
@Component({
  imports: [TarjetaPublicacion],
  selector: 'app-listado-publicaciones',
  templateUrl: './listado-publicaciones.html',
  styleUrl: './listado-publicaciones.css',
})
export class ListadoPublicaciones {
  private api = inject(PublicacionesApi);

  usuarioId = input<string>();

  protected orden = signal<OrdenPublicaciones>('fecha');
  protected pagina = signal(1);
  protected publicaciones = signal<Publicacion[]>([]);
  protected total = signal(0);
  protected estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  protected aviso = signal('');

  protected totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / PUBLICACIONES_POR_PAGINA)),
  );

  // Cada pedido tiene un número; si llega una respuesta de uno viejo, se ignora
  private numeroPedido = 0;
  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  constructor() {
    // Carga al abrir y cada vez que cambia el usuario filtrado (por ejemplo, de un perfil a otro)
    effect(() => {
      this.usuarioId();
      untracked(() => {
        this.pagina.set(1);
        void this.cargar();
      });
    });
  }

  protected async cargar(): Promise<void> {
    const numero = ++this.numeroPedido;
    this.estado.set('cargando');
    try {
      const respuesta = await this.api.listar(this.orden(), this.pagina(), {
        usuarioId: this.usuarioId(),
      });
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

  // Después de crear una publicación: primera página ordenada por fecha, donde aparece la nueva
  alCrear() {
    this.orden.set('fecha');
    this.pagina.set(1);
    this.mostrarAviso('¡Publicación creada!');
    void this.cargar();
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

  // Solo se reemplaza esa tarjeta, con los números reales que devolvió la API
  protected reemplazar(actualizada: Publicacion) {
    this.publicaciones.update((lista) => lista.map((p) => (p.id === actualizada.id ? actualizada : p)));
  }

  // Se vuelve a pedir la página actual para que el total y las páginas coincidan
  protected alEliminar() {
    this.mostrarAviso('Publicación eliminada');
    void this.cargar();
  }

  private mostrarAviso(mensaje: string) {
    clearTimeout(this.temporizadorAviso);
    this.aviso.set(mensaje);
    this.temporizadorAviso = setTimeout(() => this.aviso.set(''), 4000);
  }
}
