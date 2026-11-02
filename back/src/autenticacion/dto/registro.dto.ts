import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { EdadMinima } from '../../common/edad-minima.validator.js';
import { recortar } from '../../common/recortar.js';

export class RegistroDto {
  @Transform(recortar)
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'El nombre puede tener hasta 50 caracteres' })
  nombre: string;

  @Transform(recortar)
  @IsString({ message: 'El apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(50, { message: 'El apellido puede tener hasta 50 caracteres' })
  apellido: string;

  @Transform(recortar)
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(100, { message: 'El correo puede tener hasta 100 caracteres' })
  correo: string;

  @Transform(recortar)
  @IsString({ message: 'El nombre de usuario debe ser un texto' })
  @Matches(/^[A-Za-z0-9_.]{3,20}$/, {
    message:
      'El nombre de usuario debe tener entre 3 y 20 caracteres: letras, números, "_" o "."',
  })
  nombreUsuario: string;

  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(64, { message: 'La contraseña puede tener hasta 64 caracteres' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe tener al menos una mayúscula' })
  @Matches(/\d/, { message: 'La contraseña debe tener al menos un número' })
  contrasena: string;

  @Transform(recortar)
  @Validate(EdadMinima)
  fechaNacimiento: string;

  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(200, { message: 'La descripción puede tener hasta 200 caracteres' })
  descripcion?: string;
}
