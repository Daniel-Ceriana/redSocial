import { Component, inject, output, signal } from '@angular/core';
import {
  form,
  FormField,
  maxLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Auth } from '../../../services/auth';
import { Modal } from '../../../services/modal';
import { mensajesDeError } from '../../../utilidades/errores';
import { aTextoFecha, fechaHaceAnios } from '../../../utilidades/fechas';
import { validarImagen } from '../../../utilidades/imagen';
import { Avatar } from '../../compartido/avatar/avatar';

const EDAD_MINIMA = 13;

// Formulario para editar el propio perfil. El correo se ve pero no se puede cambiar.
@Component({
  imports: [FormField, Avatar],
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.html',
  styleUrl: './editar-perfil.css',
})
export class EditarPerfil {
  private auth = inject(Auth);
  private modal = inject(Modal);

  guardado = output<void>();
  cancelado = output<void>();

  // Esta pantalla solo se muestra con sesión iniciada
  protected usuario = this.auth.usuario;
  private inicial = this.auth.usuario()!;

  protected fechaMaxima = fechaHaceAnios(EDAD_MINIMA);

  protected model = signal({
    nombre: this.inicial.nombre,
    apellido: this.inicial.apellido,
    nombreUsuario: this.inicial.nombreUsuario,
    fechaNacimiento: this.inicial.fechaNacimiento,
    descripcion: this.inicial.descripcion,
    contrasena: '',
    repetirContrasena: '',
  });

  protected perfilForm = form(this.model, (p) => {
    required(p.nombre, { message: 'El nombre es obligatorio' });
    maxLength(p.nombre, 50, { message: 'El nombre puede tener hasta 50 caracteres' });

    required(p.apellido, { message: 'El apellido es obligatorio' });
    maxLength(p.apellido, 50, { message: 'El apellido puede tener hasta 50 caracteres' });

    required(p.nombreUsuario, { message: 'El nombre de usuario es obligatorio' });
    pattern(p.nombreUsuario, /^[A-Za-z0-9_.]{3,20}$/, {
      message: 'Entre 3 y 20 caracteres: letras, números, "_" o "."',
    });

    required(p.fechaNacimiento, { message: 'La fecha de nacimiento es obligatoria' });
    validate(p.fechaNacimiento, ({ value }) => {
      const fecha = value();
      if (!fecha) return null; // ya lo cubre required
      if (fecha > aTextoFecha(new Date())) {
        return { kind: 'futura', message: 'La fecha de nacimiento no puede ser futura' };
      }
      if (fecha > this.fechaMaxima) {
        return {
          kind: 'menor',
          message: `Tenés que tener al menos ${EDAD_MINIMA} años para registrarte`,
        };
      }
      return null;
    });

    maxLength(p.descripcion, 200, { message: 'La descripción puede tener hasta 200 caracteres' });

    // La contraseña nueva es opcional: solo se valida si se escribió algo
    validate(p.contrasena, ({ value }) => {
      const contrasena = value();
      if (!contrasena) return null;
      const mensaje =
        contrasena.length < 8
          ? 'La contraseña debe tener al menos 8 caracteres'
          : contrasena.length > 64
            ? 'La contraseña puede tener hasta 64 caracteres'
            : !/[A-Z]/.test(contrasena)
              ? 'La contraseña debe tener al menos una mayúscula'
              : !/\d/.test(contrasena)
                ? 'La contraseña debe tener al menos un número'
                : '';
      return mensaje ? { kind: 'contrasena', message: mensaje } : null;
    });
    validate(p.repetirContrasena, ({ value, valueOf }) =>
      value() !== valueOf(p.contrasena)
        ? { kind: 'distintas', message: 'Las contraseñas no coinciden' }
        : null,
    );
  });

  // Imagen nueva (opcional), o quitar la que ya tiene
  protected imagen = signal<File | null>(null);
  protected vistaPrevia = signal('');
  protected errorImagen = signal('');
  protected quitarActual = signal(false);

  protected onImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.descartarImagenNueva();
    if (!archivo) return;

    const error = validarImagen(archivo);
    if (error) {
      this.errorImagen.set(error);
      input.value = '';
      return;
    }
    this.quitarActual.set(false);
    this.imagen.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  protected descartarImagenNueva(input?: HTMLInputElement) {
    if (this.vistaPrevia()) URL.revokeObjectURL(this.vistaPrevia());
    this.imagen.set(null);
    this.vistaPrevia.set('');
    this.errorImagen.set('');
    if (input) input.value = '';
  }

  protected cancelar() {
    this.descartarImagenNueva();
    this.cancelado.emit();
  }

  async onSubmit(event: Event, inputImagen: HTMLInputElement) {
    event.preventDefault();

    await submit(this.perfilForm, async () => {
      const { repetirContrasena, contrasena, ...datos } = this.model();
      void repetirContrasena; // solo se usa para validar en el front

      // Se mandan solo los campos que cambiaron
      const cuerpo = new FormData();
      for (const [campo, valor] of Object.entries(datos)) {
        if (valor !== this.inicial[campo as keyof typeof this.inicial]) cuerpo.append(campo, valor);
      }
      if (contrasena) cuerpo.append('contrasena', contrasena);
      const imagen = this.imagen();
      if (imagen) cuerpo.append('imagen', imagen);
      else if (this.quitarActual()) cuerpo.append('quitarImagen', 'true');

      if (![...cuerpo.keys()].length) {
        await this.modal.avisar('Sin cambios', 'No modificaste ningún dato.');
        return;
      }

      try {
        await this.auth.actualizarPerfil(cuerpo);
        this.descartarImagenNueva(inputImagen);
        this.guardado.emit();
      } catch (error) {
        await this.modal.avisar('No se pudo guardar el perfil', mensajesDeError(error));
      }
    });
  }
}
