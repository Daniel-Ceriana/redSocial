import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  form,
  FormField,
  required,
  email,
  minLength,
  maxLength,
  pattern,
  validate,
  submit,
} from '@angular/forms/signals';
import { Auth } from '../../../services/auth';
import { Modal } from '../../../services/modal';
import { mensajesDeError } from '../../../utilidades/errores';
import { aTextoFecha, fechaHaceAnios } from '../../../utilidades/fechas';

const EDAD_MINIMA = 13;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024; // 2 MB

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-registro',
  templateUrl: './registro.html',
})
export class Registro {
  private auth = inject(Auth);
  private router = inject(Router);
  private modal = inject(Modal);

  // La fecha más reciente que se puede elegir (13 años atrás)
  protected fechaMaxima = fechaHaceAnios(EDAD_MINIMA);

  private model = signal({
    nombre: '',
    apellido: '',
    correo: '',
    nombreUsuario: '',
    contrasena: '',
    repetirContrasena: '',
    fechaNacimiento: '',
    descripcion: '',
  });

  registroForm = form(this.model, (p) => {
    required(p.nombre, { message: 'El nombre es obligatorio' });
    maxLength(p.nombre, 50, { message: 'El nombre puede tener hasta 50 caracteres' });

    required(p.apellido, { message: 'El apellido es obligatorio' });
    maxLength(p.apellido, 50, { message: 'El apellido puede tener hasta 50 caracteres' });

    required(p.correo, { message: 'El correo es obligatorio' });
    email(p.correo, { message: 'El correo no tiene un formato válido' });
    maxLength(p.correo, 100, { message: 'El correo puede tener hasta 100 caracteres' });

    required(p.nombreUsuario, { message: 'El nombre de usuario es obligatorio' });
    pattern(p.nombreUsuario, /^[A-Za-z0-9_.]{3,20}$/, {
      message: 'Entre 3 y 20 caracteres: letras, números, "_" o "."',
    });

    required(p.contrasena, { message: 'La contraseña es obligatoria' });
    minLength(p.contrasena, 8, { message: 'La contraseña debe tener al menos 8 caracteres' });
    maxLength(p.contrasena, 64, { message: 'La contraseña puede tener hasta 64 caracteres' });
    pattern(p.contrasena, /[A-Z]/, { message: 'La contraseña debe tener al menos una mayúscula' });
    pattern(p.contrasena, /\d/, { message: 'La contraseña debe tener al menos un número' });

    required(p.repetirContrasena, { message: 'Repetí la contraseña' });
    validate(p.repetirContrasena, ({ value, valueOf }) =>
      value() && value() !== valueOf(p.contrasena)
        ? { kind: 'distintas', message: 'Las contraseñas no coinciden' }
        : null,
    );

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

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      this.errorImagen.set('La imagen debe ser JPG, PNG o WEBP');
      input.value = '';
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
      this.errorImagen.set('La imagen no puede pesar más de 2 MB');
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

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.registroForm, async () => {
      const { repetirContrasena, ...datos } = this.model();
      void repetirContrasena; // solo se usa para validar en el front

      const cuerpo = new FormData();
      for (const [campo, valor] of Object.entries(datos)) cuerpo.append(campo, valor);
      const imagen = this.imagen();
      if (imagen) cuerpo.append('imagen', imagen);

      try {
        await this.auth.registro(cuerpo);
        await this.modal.avisar(
          '¡Bienvenido a La Trochita!',
          'Tu cuenta se creó correctamente y ya iniciaste sesión.',
        );
        await this.router.navigate(['/publicaciones']);
      } catch (error) {
        await this.modal.avisar('No se pudo crear la cuenta', mensajesDeError(error));
      }
    });
  }
}
