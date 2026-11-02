import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Publicacion } from '../../../modelos/publicacion';
import { FechaArgentinaPipe } from '../../../pipes/fecha-argentina';
import { TiempoRelativoPipe } from '../../../pipes/tiempo-relativo';
import { AccionesPublicacion } from '../../../services/acciones-publicacion';
import { Auth } from '../../../services/auth';
import { Avatar } from '../../compartido/avatar/avatar';

// Una publicación. Dar me gusta y eliminar los hace el servicio compartido; la tarjeta avisa el resultado.
@Component({
  imports: [Avatar, RouterLink, TiempoRelativoPipe, FechaArgentinaPipe],
  selector: 'app-tarjeta-publicacion',
  templateUrl: './tarjeta-publicacion.html',
  styleUrl: './tarjeta-publicacion.css',
})
export class TarjetaPublicacion {
  private auth = inject(Auth);
  protected acciones = inject(AccionesPublicacion);

  publicacion = input.required<Publicacion>();

  // Cambió el me gusta: trae la publicación con los números nuevos
  cambio = output<Publicacion>();
  // Se eliminó: quien muestra la lista tiene que volver a pedirla
  eliminada = output<void>();
  // Lo que se veía ya no coincide con la API: hay que volver a pedir la lista
  desactualizada = output<void>();

  protected esPropia = computed(
    () => this.publicacion().autor.id === this.auth.usuario()?.id,
  );

  protected async alternarMeGusta() {
    const actualizada = await this.acciones.alternarMeGusta(this.publicacion());
    if (actualizada) this.cambio.emit(actualizada);
    else this.desactualizada.emit();
  }

  protected async eliminar() {
    const resultado = await this.acciones.eliminar(this.publicacion());
    if (resultado === 'eliminada') this.eliminada.emit();
    else if (resultado === 'error') this.desactualizada.emit();
  }
}
