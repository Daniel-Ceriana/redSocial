import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires',
});

// "2026-11-14T19:40:00Z" -> "14 NOV 2026" (hora argentina), para la chapa de bronce del diorama
@Pipe({ name: 'fechaChapa' })
export class FechaChapaPipe implements PipeTransform {
  transform(fecha: string): string {
    const partes = formato.formatToParts(new Date(fecha));
    const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
      partes.find((p) => p.type === tipo)?.value ?? '';
    // El mes corto puede venir con punto ("nov.") o con cuatro letras ("sept"): se dejan siempre tres
    const mes = parte('month').replace('.', '').slice(0, 3).toUpperCase();
    return `${parte('day')} ${mes} ${parte('year')}`;
  }
}
