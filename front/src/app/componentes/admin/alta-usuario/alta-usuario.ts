import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Modal } from '../../../services/modal';
import { UsuariosApi } from '../../../services/usuarios-api';
import { mensajesDeError } from '../../../utilidades/errores';
import { FormularioUsuario } from '../../compartido/formulario-usuario/formulario-usuario';

// dashboard/usuarios/nuevo (4.F2, D11.4): el mismo formulario del registro, con los radio buttons del perfil.
// Al crear vuelve al listado con un aviso; no inicia sesión como el usuario nuevo.
@Component({
  imports: [FormularioUsuario, RouterLink],
  selector: 'app-alta-usuario',
  template: `
    <a class="volver" routerLink="/dashboard/usuarios">‹ Volver a usuarios</a>
    <section class="tarjeta tarjeta-ancha">
      <h2>Nuevo usuario</h2>
      <app-formulario-usuario
        [conPerfil]="true"
        [enviar]="crear"
        textoBoton="Crear usuario"
        textoEnviando="Creando usuario..."
      />
    </section>
  `,
  styles: `
    .volver {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .tarjeta {
      max-width: none;
    }
  `,
})
export class AltaUsuario {
  private api = inject(UsuariosApi);
  private modal = inject(Modal);
  private router = inject(Router);

  protected crear = async (cuerpo: FormData) => {
    try {
      const creado = await this.api.alta(cuerpo);
      const perfil = creado.perfil === 'administrador' ? 'administrador' : 'usuario';
      await this.router.navigate(['/dashboard/usuarios'], {
        state: { aviso: `Se creó @${creado.nombreUsuario} como ${perfil}.` },
      });
    } catch (error) {
      await this.modal.avisar('No se pudo crear el usuario', mensajesDeError(error));
    }
  };
}
