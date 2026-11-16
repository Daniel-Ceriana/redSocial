import { SoloAdministrador } from '../../../directivas/solo-administrador';
import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoPublicacion, Publicacion } from '../../../modelos/publicacion';
import { FechaArgentinaPipe } from '../../../pipes/fecha-argentina';
import { FechaChapaPipe } from '../../../pipes/fecha-chapa';
import { LARGO_RESUMEN, ResumenPipe } from '../../../pipes/resumen';
import { TiempoRelativoPipe } from '../../../pipes/tiempo-relativo';
import { AccionesPublicacion } from '../../../services/acciones-publicacion';
import { Auth } from '../../../services/auth';
import { Avatar } from '../../compartido/avatar/avatar';

const TEXTO_ESTADO: Record<EstadoPublicacion, string> = {
  activa: 'Activa',
  eliminadaPorAutor: 'Eliminada por su autor',
  bajaPorAdministrador: 'Dada de baja por un administrador',
  ocultaPorDeshabilitacion: 'Oculta porque el autor está deshabilitado',
  eliminada: 'Eliminada',
};

// Una publicación, dibujada como una placa de estación montada en un diorama (T26 de la hoja de ruta).
// Dar me gusta y eliminar los hace el servicio compartido; la tarjeta avisa el resultado.
@Component({
  imports: [Avatar, RouterLink, SoloAdministrador, TiempoRelativoPipe, FechaArgentinaPipe, FechaChapaPipe, ResumenPipe],
  selector: 'app-tarjeta-publicacion',
  templateUrl: './tarjeta-publicacion.html',
  styleUrl: './tarjeta-publicacion.css',
})
export class TarjetaPublicacion {
  protected auth = inject(Auth);
  protected acciones = inject(AccionesPublicacion);

  publicacion = input.required<Publicacion>();
  // El título y "N comentarios" llevan a la página de la publicación (D8.4); en esa misma página, no
  enlazar = input(true);
  // false si el autor está deshabilitado: no se puede dar de alta nada suyo hasta rehabilitarlo (D11.10)
  permitirAlta = input(true);

  protected readonly LARGO_RESUMEN = LARGO_RESUMEN;

  // Cambió el me gusta: trae la publicación con los números nuevos
  cambio = output<Publicacion>();
  // Se eliminó: quien muestra la lista tiene que volver a pedirla
  eliminada = output<void>();
  // Un administrador la dio de alta otra vez: trae la publicación ya activa
  restaurada = output<Publicacion>();
  // Lo que se veía ya no coincide con la API: hay que volver a pedir la lista
  desactualizada = output<void>();

  protected esPropia = computed(
    () => this.publicacion().autor.id === this.auth.usuario()?.id,
  );
  // Las que no están activas solo le llegan a un administrador (S11)
  protected activa = computed(() => this.publicacion().estado === 'activa');
  protected textoEstado = computed(() => TEXTO_ESTADO[this.publicacion().estado]);

  // El autor elimina las suyas; un administrador, cualquiera (4.F1, D11.6)
  protected puedeEliminar = computed(() => this.esPropia() || this.auth.esAdministrador());

  protected async alternarMeGusta() {
    const actualizada = await this.acciones.alternarMeGusta(this.publicacion());
    if (actualizada) this.cambio.emit(actualizada);
    else this.desactualizada.emit();
  }

  protected async restaurar() {
    const restaurada = await this.acciones.restaurar(this.publicacion());
    if (restaurada) this.restaurada.emit(restaurada);
  }

  protected async eliminar() {
    const resultado = await this.acciones.eliminar(this.publicacion(), !this.esPropia());
    if (resultado === 'eliminada') this.eliminada.emit();
    else if (resultado === 'error') this.desactualizada.emit();
  }
}
