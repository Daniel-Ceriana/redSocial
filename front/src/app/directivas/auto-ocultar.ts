import { Directive, effect, input, output } from '@angular/core';

// Directiva de atributo (D13.2): `<p [appAutoOcultar]="4" [reiniciarCon]="aviso()" (ocultar)="aviso.set('')">`
// avisa con `ocultar` a los N segundos para que quien la usa borre el aviso. El plazo arranca de nuevo si cambia
// `reiniciarCon` (un aviso nuevo mientras el anterior sigue a la vista) y se cancela si el elemento desaparece.
@Directive({ selector: '[appAutoOcultar]' })
export class AutoOcultar {
  segundos = input.required<number>({ alias: 'appAutoOcultar' });
  reiniciarCon = input<unknown>();
  ocultar = output<void>();

  constructor() {
    effect((alLimpiar) => {
      this.reiniciarCon();
      const temporizador = setTimeout(() => this.ocultar.emit(), this.segundos() * 1000);
      alLimpiar(() => clearTimeout(temporizador));
    });
  }
}
