import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeStyle: 'short',
  hourCycle: 'h23',
  timeZone: 'America/Argentina/Buenos_Aires',
});

// "2026-11-02T17:35:00Z" -> "2 de noviembre de 2026, 14:35" (hora argentina)
@Pipe({ name: 'fechaArgentina' })
export class FechaArgentinaPipe implements PipeTransform {
  transform(fecha: string): string {
    return formato.format(new Date(fecha));
  }
}
