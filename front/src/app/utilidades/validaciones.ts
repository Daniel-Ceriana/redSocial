import { SchemaPath, validate } from '@angular/forms/signals';
import { fechaHaceAnios, hoyEnArgentina } from './fechas';

// Mismas reglas que el back (regla 8 de la hoja de ruta). El back recorta los espacios del principio y del final
// antes de validar (common/recortar.ts), así que acá se valida el texto recortado: "   " cuenta como vacío y los
// espacios de los costados no suman al largo.

export const EDAD_MINIMA = 13;

// Como ComentarioDto del back (1 a 300 caracteres, recortado)
export const LARGO_MAXIMO_COMENTARIO = 300;

// Lo que acepta @IsEmail() del back: usuario@dominio con un dominio de al menos dos letras al final (.com, .ar).
// El email() de Angular acepta "pepe@trochita", que el back rechaza.
const CORREO = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

// Como @IsNotEmpty() después de recortar
export function obligatorio(campo: SchemaPath<string>, message: string) {
  validate(campo, ({ value }) => (value().trim() ? null : { kind: 'obligatorio', message }));
}

// Como @MaxLength() después de recortar
export function largoMaximo(campo: SchemaPath<string>, maximo: number, message: string) {
  validate(campo, ({ value }) =>
    value().trim().length > maximo ? { kind: 'largoMaximo', message } : null,
  );
}

// Como @Matches() después de recortar. Vacío no da error (eso lo marca "obligatorio").
export function patron(campo: SchemaPath<string>, regex: RegExp, message: string) {
  validate(campo, ({ value }) => {
    const texto = value().trim();
    return texto && !regex.test(texto) ? { kind: 'patron', message } : null;
  });
}

export function mensajeComentario(campo: SchemaPath<string>) {
  obligatorio(campo, 'El mensaje es obligatorio');
  largoMaximo(
    campo,
    LARGO_MAXIMO_COMENTARIO,
    `El mensaje puede tener hasta ${LARGO_MAXIMO_COMENTARIO} caracteres`,
  );
}

export function correo(campo: SchemaPath<string>) {
  patron(campo, CORREO, 'El correo no tiene un formato válido');
}

// Como EdadMinima del back (common/edad-minima.validator.ts): no futura y al menos 13 años, en fecha argentina
export function fechaNacimiento(campo: SchemaPath<string>) {
  validate(campo, ({ value }) => {
    const fecha = value();
    if (!fecha) return null; // ya lo cubre "required"
    if (fecha > hoyEnArgentina()) {
      return { kind: 'futura', message: 'La fecha de nacimiento no puede ser futura' };
    }
    if (fecha > fechaHaceAnios(EDAD_MINIMA)) {
      return {
        kind: 'menor',
        message: `Tenés que tener al menos ${EDAD_MINIMA} años para usar La Trochita`,
      };
    }
    return null;
  });
}
