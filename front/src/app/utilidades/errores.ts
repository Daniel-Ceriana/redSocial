import { HttpErrorResponse } from '@angular/common/http';

// Convierte un error de la API en una lista de mensajes para mostrar en un modal
export function mensajesDeError(error: unknown): string[] {
  if (!(error instanceof HttpErrorResponse)) {
    return ['Ocurrió un error inesperado. Probá de nuevo.'];
  }
  if (error.status === 0) {
    return ['No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo.'];
  }
  const mensaje = (error.error as { message?: string | string[] } | null)?.message;
  if (Array.isArray(mensaje) && mensaje.length) return mensaje;
  if (typeof mensaje === 'string' && mensaje) return [mensaje];
  return error.status >= 500
    ? ['El servidor tuvo un problema. Probá de nuevo en unos minutos.']
    : ['No se pudo completar la acción.'];
}
