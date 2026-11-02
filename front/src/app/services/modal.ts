import { Service, signal } from '@angular/core';

export interface EstadoModal {
  titulo: string;
  mensajes: string[];
  conCancelar: boolean;
  // Mientras está abierto, ningún otro modal lo reemplaza (por ejemplo, "Tu sesión venció")
  prioritario: boolean;
}

// Modal propio: reemplaza a alert() y confirm(). El componente <app-modal> lo dibuja.
@Service()
export class Modal {
  readonly estado = signal<EstadoModal | null>(null);
  private resolver: ((aceptado: boolean) => void) | null = null;

  // Aviso con un solo botón "Entendido"
  avisar(titulo: string, mensajes: string | string[], prioritario = false): Promise<void> {
    return this.abrir({ titulo, mensajes: [mensajes].flat(), conCancelar: false, prioritario }).then(
      () => undefined,
    );
  }

  // Pregunta con "Aceptar" y "Cancelar"; devuelve lo que eligió la persona
  confirmar(titulo: string, mensajes: string | string[]): Promise<boolean> {
    return this.abrir({ titulo, mensajes: [mensajes].flat(), conCancelar: true, prioritario: false });
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
