import { Component, inject, output, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { Modal } from '../../../services/modal';
import { PublicacionesApi } from '../../../services/publicaciones-api';
import { mensajesDeError } from '../../../utilidades/errores';
import { validarImagen } from '../../../utilidades/imagen';

// Formulario plegable para crear una publicación. Avisa con `creada` cuando la API la guardó.
@Component({
  imports: [FormField],
  selector: 'app-nueva-publicacion',
  templateUrl: './nueva-publicacion.html',
  styleUrl: './nueva-publicacion.css',
})
export class NuevaPublicacion {
  private api = inject(PublicacionesApi);
  private modal = inject(Modal);

  creada = output<void>();

  protected abierto = signal(false);

  protected model = signal({ titulo: '', descripcion: '' });

  protected nuevaForm = form(this.model, (p) => {
    required(p.titulo, { message: 'El título es obligatorio' });
    maxLength(p.titulo, 100, { message: 'El título puede tener hasta 100 caracteres' });
    maxLength(p.descripcion, 500, { message: 'La descripción puede tener hasta 500 caracteres' });
  });

  // La imagen (opcional) va aparte del formulario, porque un archivo no es un valor de texto
  protected imagen = signal<File | null>(null);
  protected vistaPrevia = signal('');
  protected errorImagen = signal('');

  protected onImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.quitarImagen();
    if (!archivo) return;

    const error = validarImagen(archivo);
    if (error) {
      this.errorImagen.set(error);
      input.value = '';
      return;
    }
    this.imagen.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  protected quitarImagen(input?: HTMLInputElement) {
    if (this.vistaPrevia()) URL.revokeObjectURL(this.vistaPrevia());
    this.imagen.set(null);
    this.vistaPrevia.set('');
    this.errorImagen.set('');
    if (input) input.value = '';
  }

  async onSubmit(event: Event, inputImagen: HTMLInputElement) {
    event.preventDefault();

    await submit(this.nuevaForm, async () => {
      const { titulo, descripcion } = this.model();
      const cuerpo = new FormData();
      cuerpo.append('titulo', titulo);
      if (descripcion) cuerpo.append('descripcion', descripcion);
      const imagen = this.imagen();
      if (imagen) cuerpo.append('imagen', imagen);

      try {
        await this.api.crear(cuerpo);
        this.model.set({ titulo: '', descripcion: '' });
        this.nuevaForm().reset();
        this.quitarImagen(inputImagen);
        this.abierto.set(false);
        this.creada.emit();
      } catch (error) {
        await this.modal.avisar('No se pudo crear la publicación', mensajesDeError(error));
      }
    });
  }
}
