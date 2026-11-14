import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { armarEscena } from './escena-maqueta';

// Fondo de toda la app: una maqueta vista desde arriba, fija detrás del contenido (T26).
// Se vuelve a armar si cambia el tamaño de la ventana. El tren no se dibuja si el sistema pide menos movimiento.
@Component({
  selector: 'app-fondo-maqueta',
  templateUrl: './fondo-maqueta.html',
  styleUrl: './fondo-maqueta.css',
  host: { 'aria-hidden': 'true' },
})
export class FondoMaqueta {
  private tamano = signal({ ancho: window.innerWidth, alto: window.innerHeight });

  protected escena = computed(() => armarEscena(this.tamano().ancho, this.tamano().alto));
  protected conTren = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Locomotora y dos coches, en orden; cada uno arranca un poco antes para ir delante del que lo sigue
  protected readonly piezas = [
    { largo: 30, color: '#1f4b3a', techo: '#2b2118', chimenea: true, adelanto: 2.1 },
    { largo: 26, color: '#7a2e22', techo: '#5a2018', chimenea: false, adelanto: 1.55 },
    { largo: 26, color: '#7a2e22', techo: '#5a2018', chimenea: false, adelanto: 1 },
  ];

  constructor() {
    let espera: ReturnType<typeof setTimeout> | undefined;
    const alCambiar = () => {
      clearTimeout(espera);
      espera = setTimeout(
        () => this.tamano.set({ ancho: window.innerWidth, alto: window.innerHeight }),
        200,
      );
    };
    window.addEventListener('resize', alCambiar);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', alCambiar);
      clearTimeout(espera);
    });
  }
}
