import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { recortar } from '../../common/recortar.js';

export class CrearPublicacionDto {
  @Transform(recortar)
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(100, { message: 'El título puede tener hasta 100 caracteres' })
  titulo: string;

  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción puede tener hasta 500 caracteres' })
  descripcion?: string;
}
