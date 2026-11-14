import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const EDAD_MINIMA = 13;

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;
const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires';

// Devuelve true si el texto es una fecha real AAAA-MM-DD (por ejemplo, no 2001-02-30)
function esFechaReal(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !FORMATO.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

// Hoy en Argentina como AAAA-MM-DD, sin importar la zona horaria del servidor (Vercel corre en UTC).
// El formato "en-CA" da justo AAAA-MM-DD. El front calcula igual (front/src/app/utilidades/fechas.ts).
function hoyEnArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_ARGENTINA }).format(new Date());
}

// Hoy en Argentina menos `anios` años (un 29/02 pasa al 01/03 si el año no es bisiesto)
function fechaHaceAnios(anios: number): string {
  const [anio, mes, dia] = hoyEnArgentina().split('-').map(Number);
  return new Date(Date.UTC(anio - anios, mes - 1, dia)).toISOString().slice(0, 10);
}

// Fecha real, no futura y de alguien con al menos EDAD_MINIMA años, según la fecha de hoy en Argentina.
// Las fechas AAAA-MM-DD se pueden comparar como texto.
@ValidatorConstraint({ name: 'edadMinima', async: false })
export class EdadMinima implements ValidatorConstraintInterface {
  validate(valor: unknown): boolean {
    return esFechaReal(valor) && valor <= fechaHaceAnios(EDAD_MINIMA);
  }

  defaultMessage(args: ValidationArguments): string {
    if (!esFechaReal(args.value)) {
      return 'La fecha de nacimiento debe ser una fecha válida con formato AAAA-MM-DD';
    }
    if (args.value > hoyEnArgentina()) {
      return 'La fecha de nacimiento no puede ser futura';
    }
    return `Tenés que tener al menos ${EDAD_MINIMA} años para usar La Trochita`;
  }
}
