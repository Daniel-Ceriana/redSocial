import { Component, computed, input } from '@angular/core';
import { Usuario } from '../../../modelos/usuario';

// Foto de perfil; si el usuario no tiene, un círculo con su inicial
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar {
  usuario = input.required<Usuario>();
  tamano = input(40);

  protected inicial = computed(() => this.usuario().nombre.charAt(0).toUpperCase());
}
