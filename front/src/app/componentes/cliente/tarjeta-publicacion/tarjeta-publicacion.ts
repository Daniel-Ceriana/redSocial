import { Component, computed, inject, input, output } from '@angular/core';
import { Publicacion } from '../../../modelos/publicacion';
import { FechaArgentinaPipe } from '../../../pipes/fecha-argentina';
import { TiempoRelativoPipe } from '../../../pipes/tiempo-relativo';
import { Auth } from '../../../services/auth';
import { Avatar } from '../../compartido/avatar/avatar';

// Una publicación del listado. No habla con la API: avisa lo que se pidió y la página lo resuelve.
@Component({
  imports: [Avatar, TiempoRelativoPipe, FechaArgentinaPipe],
  selector: 'app-tarjeta-publicacion',
  templateUrl: './tarjeta-publicacion.html',
  styleUrl: './tarjeta-publicacion.css',
})
export class TarjetaPublicacion {
  private auth = inject(Auth);

  publicacion = input.required<Publicacion>();
  // La página la marca mientras espera la respuesta de la API
  ocupada = input(false);

  alternarMeGusta = output<Publicacion>();
  eliminar = output<Publicacion>();

  protected esPropia = computed(
    () => this.publicacion().autor.id === this.auth.usuario()?.id,
  );
}
