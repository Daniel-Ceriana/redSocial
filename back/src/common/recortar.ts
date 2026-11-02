// Para @Transform: saca los espacios del principio y del final de los textos
export const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
