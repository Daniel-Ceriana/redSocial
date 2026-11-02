import { IsIn, IsMongoId, IsOptional } from 'class-validator';
import { PaginacionDto } from '../../common/paginacion.dto.js';

export class ConsultaPublicacionesDto extends PaginacionDto {
  @IsOptional()
  @IsIn(['fecha', 'meGusta'], { message: 'orden debe ser "fecha" o "meGusta"' })
  orden: 'fecha' | 'meGusta' = 'fecha';

  @IsOptional()
  @IsMongoId({ message: 'usuario debe ser un id válido' })
  usuario?: string;
}
