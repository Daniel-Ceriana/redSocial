import { Component, input } from '@angular/core';
import { Locomotora } from '../locomotora/locomotora';

// Estado de carga (E3): una locomotora que avanza por la vía, con el texto debajo
@Component({
  imports: [Locomotora],
  selector: 'app-cargando',
  template: `
    <div class="pista" aria-hidden="true">
      <app-locomotora [animada]="true" />
    </div>
    <p>{{ texto() }}</p>
  `,
  styleUrl: './cargando.css',
  host: { role: 'status' },
})
export class Cargando {
  texto = input('Cargando...');
}
