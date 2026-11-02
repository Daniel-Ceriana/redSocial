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
  submit,
} from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../../services/auth';
import { Modal } from '../../../services/modal';
import { mensajesDeError } from '../../../utilidades/errores';

// Cuentas creadas por el seed del back (npm run seed)
const CUENTAS_RAPIDAS = {
  usuario: { correo: 'usuario@trochita.com', contrasena: 'Trochita123' },
  administrador: { correo: 'admin@trochita.com', contrasena: 'Trochita123' },
};

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  private modal = inject(Modal);

  errorMsg = signal('');

  private model = signal({ correo: '', contrasena: '' });

  loginForm = form(this.model, (p) => {
    required(p.correo, { message: 'El correo es obligatorio' });
    email(p.correo, { message: 'El correo no tiene un formato válido' });

    required(p.contrasena, { message: 'La contraseña es obligatoria' });
    minLength(p.contrasena, 8, { message: 'La contraseña debe tener al menos 8 caracteres' });
    maxLength(p.contrasena, 64, { message: 'La contraseña puede tener hasta 64 caracteres' });
    pattern(p.contrasena, /[A-Z]/, { message: 'La contraseña debe tener al menos una mayúscula' });
    pattern(p.contrasena, /\d/, { message: 'La contraseña debe tener al menos un número' });
  });

  // Acceso rápido: solo completa el formulario; después se aprieta "Ingresar"
  completar(cuenta: keyof typeof CUENTAS_RAPIDAS) {
    this.errorMsg.set('');
    this.model.set({ ...CUENTAS_RAPIDAS[cuenta] });
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.errorMsg.set('');

    await submit(this.loginForm, async () => {
      const { correo, contrasena } = this.model();
      try {
        await this.auth.login(correo, contrasena);
        await this.router.navigate(['/publicaciones']);
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.errorMsg.set('Correo o contraseña incorrectos');
        } else {
          await this.modal.avisar('No se pudo iniciar sesión', mensajesDeError(error));
        }
      }
    });
  }
}
