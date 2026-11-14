import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-sin-permiso',
  templateUrl: './sin-permiso.html',
  styles: `
    .luz {
      fill: #4a2a24;
      animation: titilar 1s steps(1) infinite;
    }

    .luz-2 {
      animation-delay: 0.5s;
    }

    @keyframes titilar {
      0% {
        fill: #ff4b3e;
      }
      50% {
        fill: #4a2a24;
      }
    }

    /* Sin animación, las dos luces quedan prendidas */
    @media (prefers-reduced-motion: reduce) {
      .luz {
        fill: #ff4b3e;
      }
    }
  `,
})
export class SinPermiso {}
