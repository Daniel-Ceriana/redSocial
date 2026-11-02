const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024; // 2 MB

// Mismas reglas que el back. Devuelve el mensaje de error, o '' si la imagen sirve.
export function validarImagen(archivo: File): string {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return 'La imagen debe ser JPG, PNG o WEBP';
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) return 'La imagen no puede pesar más de 2 MB';
  return '';
}
