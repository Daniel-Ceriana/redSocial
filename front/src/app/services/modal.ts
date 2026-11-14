import { isSignal, Service, Signal, signal } from '@angular/core';

// Los mensajes pueden ser fijos o una señal que cambia mientras el modal está abierto
// (por ejemplo, la cuenta regresiva de "¿Extender la sesión?")
export type MensajesModal = string | string[] | Signal<string[]>;

export interface EstadoModal {
  titulo: string;
  mensajes: Signal<string[]>;
  conCancelar: boolean;
  // Texto del botón principal ("Entendido" en los avisos, "Aceptar" o el que se pida en las preguntas)
  textoAceptar: string;
  // Mientras está abierto, ningún otro modal lo reemplaza (por ejemplo, "Tu sesión venció")
  prioritario: boolean;
}

// Modal propio: reemplaza a alert() y confirm(). El componente <app-modal> lo dibuja.
@Service()
export class Modal {
  readonly estado = signal<EstadoModal | null>(null);
  private resolver: ((aceptado: boolean) => void) | null = null;

  // Aviso con un solo botón "Entendido"
  avisar(titulo: string, mensajes: MensajesModal, prioritario = false): Promise<void> {
    return this.abrir({
      titulo,
      mensajes: aSenal(mensajes),
      conCancelar: false,
      textoAceptar: 'Entendido',
      prioritario,
    }).then(() => undefined);
  }

  // Pregunta con "Aceptar" (o el texto que se pase) y "Cancelar"; devuelve lo que eligió la persona
  confirmar(titulo: string, mensajes: MensajesModal, textoAceptar = 'Aceptar'): Promise<boolean> {
    return this.abrir({
      titulo,
      mensajes: aSenal(mensajes),
      conCancelar: true,
      textoAceptar,
      prioritario: false,
    });
  }

  cerrar(aceptado: boolean) {
    this.estado.set(null);
    this.resolver?.(aceptado);
    this.resolver = null;
  }

  private abrir(estado: EstadoModal): Promise<boolean> {
    // Si hay uno prioritario abierto, el nuevo no se muestra
    if (this.estado()?.prioritario) return Promise.resolve(false);
    this.resolver?.(false); // si había otro abierto, se descarta
    this.estado.set(estado);
    return new Promise((resolve) => (this.resolver = resolve));
  }
}

function aSenal(mensajes: MensajesModal): Signal<string[]> {
  return isSignal(mensajes) ? mensajes : signal([mensajes].flat()).asReadonly();
}
