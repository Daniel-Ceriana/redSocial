import { Component, viewChild } from '@angular/core';
import { ListadoPublicaciones } from '../listado-publicaciones/listado-publicaciones';
import { NuevaPublicacion } from '../nueva-publicacion/nueva-publicacion';

@Component({
  imports: [NuevaPublicacion, ListadoPublicaciones],
  selector: 'app-publicaciones',
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones {
  protected listado = viewChild.required(ListadoPublicaciones);
}
