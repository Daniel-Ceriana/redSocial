import { Pipe, PipeTransform } from '@angular/core';

// Largo a partir del cual la descripción de una publicación se resume en las listas
export const LARGO_RESUMEN = 200;

// Recorta un texto largo sin cortar palabras: "Estoy armando el trazado de..." (agrega "…").
// Si el texto entra, lo devuelve igual. Ej.: {{ descripcion | resumen }} o {{ texto | resumen: 80 }}
@Pipe({ name: 'resumen' })
export class ResumenPipe implements PipeTransform {
  transform(texto: string, maximo = LARGO_RESUMEN): string {
    if (texto.length <= maximo) return texto;
    const corte = texto.slice(0, maximo);
    const ultimoEspacio = corte.lastIndexOf(' ');
    // Si no hay espacios (una palabra larguísima), se corta justo en el máximo
    const recortado = ultimoEspacio > 0 ? corte.slice(0, ultimoEspacio) : corte;
    // Sin signos colgando antes de los puntos suspensivos ("hola, …" -> "hola…")
    return recortado.replace(/[\s.,;:!?¡¿-]+$/, '') + '…';
  }
}
