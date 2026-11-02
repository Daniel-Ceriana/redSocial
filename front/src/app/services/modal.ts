import { Service, signal } from '@angular/core';

export interface EstadoModal {
  titulo: string;
  mensajes: string[];
  conCancelar: boolean;
}

// Modal propio: reemplaza a alert() y confirm(). El componente <app-modal> lo dibuja.
@Service()
export class Modal {
  readonly estado = signal<EstadoModal | null>(null);
  private resolver: ((aceptado: boolean) => void) | null = null;

  // Aviso con un solo botón "Entendido"
  avisar(titulo: string, mensajes: string | string[]): Promise<void> {
    return this.abrir({ titulo, mensajes: [mensajes].flat(), conCancelar: false }).then(() => undefined);
  }

  // Pregunta con "Aceptar" y "Cancelar"; devuelve lo que eligió la persona
  confirmar(titulo: string, mensajes: string | string[]): Promise<boolean> {
    return this.abrir({ titulo, mensajes: [mensajes].flat(), conCancelar: true });
  }

  cerrar(aceptado: boolean) {
    this.estado.set(null);
    this.resolver?.(aceptado);
    this.resolver = null;
  }

  private abrir(estado: EstadoModal): Promise<boolean> {
    this.resolver?.(false); // si había uno abierto, se descarta
    this.estado.set(estado);
    return new Promise((resolve) => (this.resolver = resolve));
  }
}
