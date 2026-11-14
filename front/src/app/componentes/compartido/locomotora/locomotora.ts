import { Component, input } from '@angular/core';

// Locomotora a vapor dibujada en SVG (la usan la navegación, la pantalla de carga y la ilustración del login).
// El color del cuerpo sale de "color" (currentColor); la ventana y las ruedas, de --ventana y --rueda.
// Con `animada`, las ruedas giran y sale humo de la chimenea.
@Component({
  selector: 'app-locomotora',
  templateUrl: './locomotora.html',
  styleUrl: './locomotora.css',
  host: { '[class.animada]': 'animada()', 'aria-hidden': 'true' },
})
export class Locomotora {
  animada = input(false);
}
