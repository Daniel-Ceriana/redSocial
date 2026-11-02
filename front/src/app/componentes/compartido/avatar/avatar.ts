import { Component, computed, input } from '@angular/core';

export interface DatosAvatar {
  nombre: string;
  nombreUsuario: string;
  imagenPerfil: string;
}

// Foto de perfil; si el usuario no tiene, un círculo con su inicial
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar {
  usuario = input.required<DatosAvatar>();
  tamano = input(40);

  protected inicial = computed(() => this.usuario().nombre.charAt(0).toUpperCase());
}
