import { isSignal, Service, Signal, signal } from '@angular/core';

// Los mensajes pueden ser fijos o una señal que cambia mientras el modal está abierto
// (por ejemplo, la cuenta regresiva de "¿Extender la sesión?")
export type MensajesModal = string | string[] | Signal<string[]>;

// Un botón del modal: el texto, lo que devuelve si lo eligen y cómo se ve
export interface OpcionModal<T = unknown> {
  texto: string;
  valor: T;
  estilo: 'principal' | 'secundario' | 'peligro';
}

export interface EstadoModal {
  titulo: string;
  mensajes: Signal<string[]>;
  opciones: OpcionModal[];
  // Lo que se devuelve si se cierra sin elegir (tecla Escape o clic afuera)
  valorAlCancelar: unknown;
  // Mientras está abierto, ningún otro modal lo reemplaza (por ejemplo, "Tu sesión venció")
  prioritario: boolean;
}

// Modal propio: reemplaza a alert() y confirm(). El componente <app-modal> lo dibuja.
@Service()
export class Modal {
  readonly estado = signal<EstadoModal | null>(null);
  private resolver: ((valor: unknown) => void) | null = null;

  // Aviso con un solo botón "Entendido"
  avisar(titulo: string, mensajes: MensajesModal, prioritario = false): Promise<void> {
    return this.abrir({
      titulo,
      mensajes: aSenal(mensajes),
      opciones: [{ texto: 'Entendido', valor: undefined, estilo: 'principal' }],
      valorAlCancelar: undefined,
      prioritario,
    }).then(() => undefined);
  }

  // Pregunta con "Aceptar" (o el texto que se pase) y "Cancelar"; devuelve lo que eligió la persona
  confirmar(titulo: string, mensajes: MensajesModal, textoAceptar = 'Aceptar'): Promise<boolean> {
    return this.abrir({
      titulo,
      mensajes: aSenal(mensajes),
      opciones: [
        { texto: 'Cancelar', valor: false, estilo: 'secundario' },
        { texto: textoAceptar, valor: true, estilo: 'principal' },
      ],
      valorAlCancelar: false,
      prioritario: false,
    }) as Promise<boolean>;
  }

  // Pregunta con varios botones (por ejemplo, deshabilitar ocultando o no las publicaciones).
  // Devuelve el valor del botón elegido, o null si se cerró sin elegir.
  elegir<T>(titulo: string, mensajes: MensajesModal, opciones: OpcionModal<T>[]): Promise<T | null> {
    return this.abrir({
      titulo,
      mensajes: aSenal(mensajes),
      opciones,
      valorAlCancelar: null,
      prioritario: false,
    }) as Promise<T | null>;
  }

  cerrar(valor: unknown) {
    this.estado.set(null);
    this.resolver?.(valor);
    this.resolver = null;
  }

  // Escape o clic afuera
  cancelar() {
    const estado = this.estado();
    if (estado) this.cerrar(estado.valorAlCancelar);
  }

  private abrir(estado: EstadoModal): Promise<unknown> {
    const actual = this.estado();
    // Si hay uno prioritario abierto, el nuevo no se muestra
    if (actual?.prioritario) return Promise.resolve(estado.valorAlCancelar);
    // Si había otro abierto, se descarta como si lo hubieran cancelado
    if (actual) this.resolver?.(actual.valorAlCancelar);
    this.estado.set(estado);
    return new Promise((resolve) => (this.resolver = resolve));
  }
}

function aSenal(mensajes: MensajesModal): Signal<string[]> {
  return isSignal(mensajes) ? mensajes : signal([mensajes].flat()).asReadonly();
}
