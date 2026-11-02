import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const EDAD_MINIMA = 13;

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

// Devuelve la fecha si el texto es una fecha real AAAA-MM-DD; si no, null
function leerFecha(valor: unknown): Date | null {
  if (typeof valor !== 'string' || !FORMATO.test(valor)) return null;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
    return null;
  }
  return fecha;
}

// Fecha real, no futura y de alguien con al menos EDAD_MINIMA años
@ValidatorConstraint({ name: 'edadMinima', async: false })
export class EdadMinima implements ValidatorConstraintInterface {
  validate(valor: unknown): boolean {
    const fecha = leerFecha(valor);
    if (!fecha) return false;
    const limite = new Date();
    limite.setUTCFullYear(limite.getUTCFullYear() - EDAD_MINIMA);
    return fecha.getTime() <= limite.getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    const fecha = leerFecha(args.value);
    if (!fecha) {
      return 'La fecha de nacimiento debe ser una fecha válida con formato AAAA-MM-DD';
    }
    if (fecha.getTime() > Date.now()) {
      return 'La fecha de nacimiento no puede ser futura';
    }
    return `Tenés que tener al menos ${EDAD_MINIMA} años para registrarte`;
  }
}
