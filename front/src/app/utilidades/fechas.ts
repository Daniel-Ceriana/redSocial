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
