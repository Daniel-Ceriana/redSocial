import { IsIn } from 'class-validator';
import { RegistroDto } from '../../autenticacion/dto/registro.dto.js';
import type { Perfil } from '../entities/usuario.entity.js';

// Alta hecha por un administrador (4.B3): los mismos campos y reglas que el registro, más el perfil
export class AltaUsuarioDto extends RegistroDto {
  @IsIn(['usuario', 'administrador'], { message: 'perfil debe ser "usuario" o "administrador"' })
  perfil: Perfil;
}
