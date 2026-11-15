import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../services/auth';
import { Modal } from '../../../services/modal';
import { mensajesDeError } from '../../../utilidades/errores';
import { EscenaTren } from '../escena-tren/escena-tren';
import { FormularioUsuario } from '../formulario-usuario/formulario-usuario';

// Registro: el formulario es el compartido (D11.1); acá solo se decide qué pasa al enviarlo
@Component({
  imports: [RouterLink, EscenaTren, FormularioUsuario],
  selector: 'app-registro',
  templateUrl: './registro.html',
})
export class Registro {
  private auth = inject(Auth);
  private router = inject(Router);
  private modal = inject(Modal);

  // Se registra, queda con la sesión iniciada y entra a la app
  protected registrarse = async (cuerpo: FormData) => {
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
  };
}
