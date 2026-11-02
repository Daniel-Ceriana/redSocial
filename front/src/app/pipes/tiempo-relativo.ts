import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });

// Unidades de la más grande a la más chica, con sus segundos
const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

// "2026-11-02T17:35:00Z" -> "hace 5 minutos", "hace 2 horas", "ayer"
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  transform(fecha: string): string {
    // Nunca en el futuro (por si el reloj de la compu está adelantado)
    const segundos = Math.min(0, Math.round((new Date(fecha).getTime() - Date.now()) / 1000));
    for (const [unidad, enSegundos] of UNIDADES) {
      if (Math.abs(segundos) >= enSegundos) {
        return formato.format(Math.trunc(segundos / enSegundos), unidad);
      }
    }
    return Math.abs(segundos) < 10 ? 'ahora' : formato.format(segundos, 'second');
  }
}
