import { Component, computed, inject, input, output, signal } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import { ComentarioPublicacion } from '../../../modelos/comentario';
import { FechaArgentinaPipe } from '../../../pipes/fecha-argentina';
import { TiempoRelativoPipe } from '../../../pipes/tiempo-relativo';
import { Auth } from '../../../services/auth';
import { Modal } from '../../../services/modal';
import { PublicacionesApi } from '../../../services/publicaciones-api';
import { mensajesDeError } from '../../../utilidades/errores';
import { LARGO_MAXIMO_COMENTARIO, mensajeComentario } from '../../../utilidades/validaciones';
import { Avatar } from '../avatar/avatar';

// Un comentario: quién lo escribió, cuándo y el mensaje ("editado" si el autor lo modificó).
// Con `editable`, el autor puede editarlo en el mismo cartel (D8.3); avisa con `editado` el comentario nuevo.
@Component({
  imports: [Avatar, FormField, TiempoRelativoPipe, FechaArgentinaPipe],
  selector: 'app-comentario',
  templateUrl: './comentario.html',
  styleUrl: './comentario.css',
})
export class Comentario {
  private auth = inject(Auth);
  private api = inject(PublicacionesApi);
  private modal = inject(Modal);

  comentario = input.required<ComentarioPublicacion>();
  editable = input(false);

  editado = output<ComentarioPublicacion>();

  protected readonly LARGO_MAXIMO = LARGO_MAXIMO_COMENTARIO;

  protected esMio = computed(() => this.comentario().autor.id === this.auth.usuario()?.id);
  protected editando = signal(false);

  protected model = signal({ mensaje: '' });
  protected edicionForm = form(this.model, (p) => {
    mensajeComentario(p.mensaje);
  });

  protected empezarEdicion() {
    this.model.set({ mensaje: this.comentario().mensaje });
    this.edicionForm().reset();
    this.editando.set(true);
  }

  protected cancelar() {
    this.editando.set(false);
  }

  async guardar(event: Event) {
    event.preventDefault();
    await submit(this.edicionForm, async () => {
      const c = this.comentario();
      try {
        const actualizado = await this.api.editarComentario(
          c.publicacion,
          c.id,
          this.model().mensaje.trim(),
        );
        this.editando.set(false);
        this.editado.emit(actualizado);
      } catch (error) {
        await this.modal.avisar('No se pudo editar el comentario', mensajesDeError(error));
      }
    });
  }
}
