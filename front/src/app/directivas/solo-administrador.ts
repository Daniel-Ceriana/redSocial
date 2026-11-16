import { Directive, effect, EmbeddedViewRef, inject, TemplateRef, ViewContainerRef } from '@angular/core';
import { Auth } from '../services/auth';

// Directiva estructural (D13.2): `<a *appSoloAdministrador>` muestra el elemento solo si la sesión es de un
// administrador. Si la sesión cambia (cierra sesión, entra otro usuario), lo agrega o lo saca solo.
// Es solo de presentación: lo que protege de verdad es el SoloAdministradorGuard del back.
@Directive({ selector: '[appSoloAdministrador]' })
export class SoloAdministrador {
  private plantilla = inject(TemplateRef<unknown>);
  private contenedor = inject(ViewContainerRef);
  private auth = inject(Auth);
  private vista?: EmbeddedViewRef<unknown>;

  constructor() {
    effect(() => {
      const esAdministrador = this.auth.esAdministrador();
      if (esAdministrador && !this.vista) {
        this.vista = this.contenedor.createEmbeddedView(this.plantilla);
      } else if (!esAdministrador && this.vista) {
        this.contenedor.clear();
        this.vista = undefined;
      }
    });
  }
}
