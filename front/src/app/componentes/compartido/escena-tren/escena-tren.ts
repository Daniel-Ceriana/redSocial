import { Component } from '@angular/core';
import { Locomotora } from '../locomotora/locomotora';

// Ilustración del login y del registro (E8): la locomotora echando humo frente a la cordillera, sobre la vía
@Component({
  imports: [Locomotora],
  selector: 'app-escena-tren',
  template: `
    <div class="sol"></div>
    <div class="montanas"></div>
    <app-locomotora [animada]="true" />
    <div class="via"></div>
  `,
  styleUrl: './escena-tren.css',
  host: { 'aria-hidden': 'true' },
})
export class EscenaTren {}
