import { FileTypeValidator, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';

const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024; // 2 MB

// Imagen opcional: JPG, PNG o WEBP de hasta 2 MB (se usa en el registro y en las publicaciones)
export function crearPipeImagen() {
  return new ParseFilePipe({
    fileIsRequired: false,
    validators: [
      new MaxFileSizeValidator({
        maxSize: TAMANO_MAXIMO_IMAGEN,
        message: 'La imagen no puede pesar más de 2 MB',
      }),
      new FileTypeValidator({
        fileType: /^image\/(jpeg|png|webp)$/,
        errorMessage: 'La imagen debe ser JPG, PNG o WEBP',
      }),
    ],
  });
}
