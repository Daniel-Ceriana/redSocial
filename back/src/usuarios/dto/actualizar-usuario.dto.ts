import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { RegistroDto } from '../../autenticacion/dto/registro.dto.js';

// Mismas reglas que el registro, pero todo opcional y sin el correo (no se puede cambiar).
// "contrasena" es la contraseña nueva. El perfil (rol) y "activo" tampoco se pueden tocar.
export class ActualizarUsuarioDto extends PartialType(
  OmitType(RegistroDto, ['correo'] as const),
) {
  // En form-data llega como texto: "true" / "false"
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'quitarImagen debe ser true o false' })
  quitarImagen?: boolean;
}
