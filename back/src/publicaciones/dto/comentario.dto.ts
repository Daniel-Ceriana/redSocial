import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { recortar } from '../../common/recortar.js';

export const LARGO_MAXIMO_COMENTARIO = 300;

// Cuerpo para crear (POST) y para editar (PUT) un comentario: solo el mensaje (D7.7)
export class ComentarioDto {
  @Transform(recortar)
  @IsString({ message: 'El mensaje debe ser un texto' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @MaxLength(LARGO_MAXIMO_COMENTARIO, {
    message: `El mensaje puede tener hasta ${LARGO_MAXIMO_COMENTARIO} caracteres`,
  })
  mensaje: string;
}
