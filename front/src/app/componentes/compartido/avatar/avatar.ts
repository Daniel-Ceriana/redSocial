import { Component, computed, input } from '@angular/core';

export interface DatosAvatar {
  nombre: string;
  nombreUsuario: string;
  imagenPerfil: string;
}

// Las 12 marcas de la esfera del reloj (en un cuadro de 100 x 100); las de las 12, 3, 6 y 9 son más largas
const MARCAS = Array.from({ length: 12 }, (_, i) => {
  const angulo = (i * 30 * Math.PI) / 180;
  const largo = i % 3 === 0 ? 7 : 4;
  return {
    x1: 50 + Math.sin(angulo) * 45,
    y1: 50 - Math.cos(angulo) * 45,
    x2: 50 + Math.sin(angulo) * (45 - largo),
    y2: 50 - Math.cos(angulo) * (45 - largo),
    hora: i % 3 === 0,
  };
});

// Foto de perfil; si el usuario no tiene, un círculo con su inicial.
// Con `reloj`, la foto va dentro de la esfera de un reloj de estación (se usa en los perfiles).
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar {
  usuario = input.required<DatosAvatar>();
  tamano = input(40);
  reloj = input(false);

  protected readonly MARCAS = MARCAS;

  protected inicial = computed(() => this.usuario().nombre.charAt(0).toUpperCase());

  // Con reloj, la esfera suma un anillo de un 18 % del tamaño de cada lado
  protected tamanoTotal = computed(() =>
    this.reloj() ? Math.round(this.tamano() * 1.36) : this.tamano(),
  );
}
