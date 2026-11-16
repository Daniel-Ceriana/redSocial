// "2000-05-10" -> "10/05/2000" (se arma a mano para que la zona horaria no corra el día)
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires';

// Fecha de hoy en Argentina como AAAA-MM-DD, sin importar la zona horaria del navegador
// (el formato "en-CA" da justo AAAA-MM-DD). El back calcula igual (common/edad-minima.validator.ts).
export function hoyEnArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_ARGENTINA }).format(new Date());
}

// Hoy en Argentina menos `anios` años, como AAAA-MM-DD (un 29/02 pasa al 01/03 si el año no es bisiesto)
export function fechaHaceAnios(anios: number): string {
  const [anio, mes, dia] = hoyEnArgentina().split('-').map(Number);
  return new Date(Date.UTC(anio - anios, mes - 1, dia)).toISOString().slice(0, 10);
}

// Hoy en Argentina menos `dias` días, como AAAA-MM-DD
export function fechaHaceDias(dias: number): string {
  const [anio, mes, dia] = hoyEnArgentina().split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia - dias)).toISOString().slice(0, 10);
}

// Cuántos días hay entre dos fechas AAAA-MM-DD (de "desde" a "hasta", los dos incluidos)
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000) + 1;
}
