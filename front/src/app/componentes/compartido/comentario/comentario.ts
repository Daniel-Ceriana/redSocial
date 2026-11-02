import { Component, input } from '@angular/core';
import { ComentarioPublicacion } from '../../../modelos/comentario';
import { FechaArgentinaPipe } from '../../../pipes/fecha-argentina';
import { TiempoRelativoPipe } from '../../../pipes/tiempo-relativo';
import { Avatar } from '../avatar/avatar';

// Un comentario: quién lo escribió, cuándo y el mensaje ("editado" si el autor lo modificó)
@Component({
  imports: [Avatar, TiempoRelativoPipe, FechaArgentinaPipe],
  selector: 'app-comentario',
  templateUrl: './comentario.html',
  styleUrl: './comentario.css',
})
export class Comentario {
  comentario = input.required<ComentarioPublicacion>();
}
