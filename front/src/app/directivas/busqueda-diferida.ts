import { Directive, ElementRef, inject, input, OnDestroy, output } from '@angular/core';

// Directiva de atributo (D13.2): `<input appBusquedaDiferida (busqueda)="buscar($event)">` avisa con el texto
// (sin espacios de los costados) cuando se deja de escribir `espera` milisegundos, para no pedir al back en
// cada tecla. El texto se lee al cumplirse el plazo, así que siempre es el último que hay en el campo.
@Directive({
  selector: 'input[appBusquedaDiferida]',
  host: { '(input)': 'programar()' },
})
export class BusquedaDiferida implements OnDestroy {
  espera = input(300);
  busqueda = output<string>();

  private campo = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private temporizador?: ReturnType<typeof setTimeout>;

  protected programar() {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.busqueda.emit(this.campo.value.trim()), this.espera());
  }

  ngOnDestroy() {
    clearTimeout(this.temporizador);
  }
}
