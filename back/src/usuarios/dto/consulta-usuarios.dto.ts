import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginacionDto } from '../../common/paginacion.dto.js';
import { recortar } from '../../common/recortar.js';

export const LARGO_MAXIMO_BUSQUEDA = 100;

// Query de GET /usuarios: paginación + búsqueda opcional por correo o nombre de usuario (D13.1)
export class ConsultaUsuariosDto extends PaginacionDto {
  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'buscar debe ser un texto' })
  @MaxLength(LARGO_MAXIMO_BUSQUEDA, {
    message: `buscar puede tener hasta ${LARGO_MAXIMO_BUSQUEDA} caracteres`,
  })
  buscar?: string;
}
