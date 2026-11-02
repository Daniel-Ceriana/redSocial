import { Component, inject, OnInit } from '@angular/core';
import { Auth } from '../../../services/auth';
import { formatearFecha } from '../../../utilidades/fechas';
import { Avatar } from '../../compartido/avatar/avatar';

@Component({
  imports: [Avatar],
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  private auth = inject(Auth);

  protected usuario = this.auth.usuario;
  protected formatearFecha = formatearFecha;

  // Muestra lo que ya hay y lo actualiza con los datos del back
  ngOnInit() {
    this.auth.refrescarUsuario().catch(() => {
      // si falla, se queda con los datos de la sesión
    });
  }
}
