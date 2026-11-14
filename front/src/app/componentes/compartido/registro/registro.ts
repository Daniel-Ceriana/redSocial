import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  form,
  FormField,
  required,
  minLength,
  maxLength,
  pattern,
  validate,
  submit,
} from '@angular/forms/signals';
import { Auth } from '../../../services/auth';
import { Modal } from '../../../services/modal';
import { mensajesDeError } from '../../../utilidades/errores';
import { fechaHaceAnios } from '../../../utilidades/fechas';
import { validarImagen } from '../../../utilidades/imagen';
import {
  correo,
  EDAD_MINIMA,
  fechaNacimiento,
  largoMaximo,
  obligatorio,
  patron,
} from '../../../utilidades/validaciones';
import { EscenaTren } from '../escena-tren/escena-tren';

@Component({
  imports: [FormField, RouterLink, EscenaTren],
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
    obligatorio(p.nombre, 'El nombre es obligatorio');
    largoMaximo(p.nombre, 50, 'El nombre puede tener hasta 50 caracteres');

    obligatorio(p.apellido, 'El apellido es obligatorio');
    largoMaximo(p.apellido, 50, 'El apellido puede tener hasta 50 caracteres');

    obligatorio(p.correo, 'El correo es obligatorio');
    correo(p.correo);
    largoMaximo(p.correo, 100, 'El correo puede tener hasta 100 caracteres');

    obligatorio(p.nombreUsuario, 'El nombre de usuario es obligatorio');
    patron(
      p.nombreUsuario,
      /^[A-Za-z0-9_.]{3,20}$/,
      'El nombre de usuario debe tener entre 3 y 20 caracteres: letras, números, "_" o "."',
    );

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
    fechaNacimiento(p.fechaNacimiento);

    largoMaximo(p.descripcion, 200, 'La descripción puede tener hasta 200 caracteres');
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
